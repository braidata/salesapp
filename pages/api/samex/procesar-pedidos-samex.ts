// pages/api/procesar-pedidos-samex.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';
import { getConnectionPool } from '../../../lib/db';
import { getOrderById } from '../../../lib/vtex';
import { mapVtexToSamex } from '../../../lib/samexMapper';

const baseUrl = process.env.NEXTAUTH_URL || '';

async function emitirSamex(payload: any) {
  const resp = await fetch(`${baseUrl}api/samex/emitir-envio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await resp.json().catch(async () => ({ raw: await resp.text() }));
  if (!resp.ok) {
    throw new Error(`SAMEX error ${resp.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

// Normaliza las distintas formas en que puede venir la respuesta de SAMEX
function extractSamex(data: any): { ot: string | number | null; etiquetaBase64: string | null } {
  let d = data;

  // Si viene envuelto en { data: ... }
  if (d && typeof d === 'object' && 'data' in d && d.data) d = d.data;

  // Si viene como arreglo, toma el primer elemento
  if (Array.isArray(d)) d = d[0];

  // Posibles claves del contenedor
  const wrapper =
    d?.respuestaDocuemtarEnvio ||
    d?.RESPUESTA_DOCUMENTAR_ENVIO ||
    d?.respuestadocuemtarenvio ||
    d;

  // Posibles claves de los campos
  const ot =
    wrapper?.numero_envio ??
    wrapper?.NUMERO_ENVIO ??
    wrapper?.nroOrdenFlete ??
    wrapper?.ot ??
    null;

  const etiquetaBase64 =
    wrapper?.etiqueta ??
    wrapper?.ETIQUETA ??
    null;

  return { ot, etiquetaBase64 };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const pool = await getConnectionPool();
    const query = `
      SELECT 
        pe_estado.idpedido AS internalId,
        pe.FechaPedido, 
        pe.CodigoExterno AS externalCode
      FROM pedidos_externos_estado pe_estado
      INNER JOIN pedidos_externos pe ON pe.ID = pe_estado.idpedido
      WHERE pe.Ecommerce = 'VENTUSCORP_VTEX'
        AND ISNULL(pe_estado.estado_envio, 0) = 0
        AND pe.deliveryCompany = 'SAMEX'
        AND pe_estado.estado = 'T'
      GROUP BY pe_estado.idpedido, pe.FechaPedido, pe.CodigoExterno
      ORDER BY pe.FechaPedido DESC
    `;

    const { recordset } = await pool.request().query(query);
    const results: Array<any> = [];

    for (const row of recordset || []) {
      const internalId: number = row.internalId;
      const externalCode: string = row.externalCode;

      try {
        // 1) Traer la orden VTEX y mapear a SAMEX
        const order = await getOrderById(externalCode);
        const payload = mapVtexToSamex(order);

        // 2) Emitir en SAMEX y extraer OT + etiqueta
        const resp = await emitirSamex(payload);
        const { ot, etiquetaBase64 } = extractSamex(resp);

        // 3) Marcar enviado
        await pool.request()
          .input('orderId', sql.Int, internalId)
          .query(`
            UPDATE pedidos_externos_estado
               SET estado_envio = 1,
                   time_notificado = GETDATE()
             WHERE idpedido = @orderId
          `);

        // 4) Guardar OT y URL si tenemos numero_envio
        if (ot) {
          await pool.request()
            .input('nro', sql.VarChar(50), String(ot))
            .input('orderId', sql.Int, internalId)
            .query(`
              UPDATE pedidos_externos
                 SET otDeliveryCompany = @nro,
                     urlDeliveryCompany = CONCAT('https://seguimiento.samex.cl?ot=', @nro)
               WHERE ID = @orderId
            `);
        }

        results.push({ internalId, externalCode, ot, etiquetaBase64, success: true });
      } catch (err: any) {
        results.push({ internalId, externalCode, error: err?.message || 'error', success: false });
      }

      // Throttle para no saturar la API de SAMEX
      await new Promise(r => setTimeout(r, 1200));
    }

    return res.status(200).json({ message: 'Proceso SAMEX completado', results });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Error procesando pedidos' });
  }
}
