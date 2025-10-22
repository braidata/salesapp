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

function extractSamexData(data: any): { 
  ot: string | number | null; 
  etiquetaUrl: string | null;
  etiquetaKey: string | null;
  resultado: string | null;
  mensaje: string | null;
} {
  if (data?.samexExtras) {
    const samexOriginal = data.respuestaDocuemtarEnvio || 
                          data.respuestaDocumentarEnvio || 
                          data[0]?.respuestaDocuemtarEnvio ||
                          data[0]?.respuestaDocumentarEnvio ||
                          {};
    
    return {
      ot: data.samexExtras.ot,
      etiquetaUrl: data.samexExtras.etiquetaUrl,
      etiquetaKey: data.samexExtras.etiquetaKey,
      resultado: samexOriginal.resultado || 'OK',
      mensaje: samexOriginal.mensaje || null
    };
  }

  let d = data;
  if (d && typeof d === 'object' && 'data' in d && d.data) d = d.data;
  if (Array.isArray(d)) d = d[0];

  const wrapper = d?.respuestaDocuemtarEnvio || 
                  d?.respuestaDocumentarEnvio || 
                  d?.RESPUESTA_DOCUMENTAR_ENVIO || 
                  d;

  return {
    ot: wrapper?.numero_envio ?? 
        wrapper?.NUMERO_ENVIO ?? 
        wrapper?.nroOrdenFlete ?? 
        wrapper?.ot ?? 
        null,
    etiquetaUrl: null,
    etiquetaKey: null,
    resultado: wrapper?.resultado || null,
    mensaje: wrapper?.mensaje || null
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  console.log('[PROCESAR-SAMEX] Iniciando proceso batch...');

  try {
    const pool = await getConnectionPool();
    // AGREGAMOS pe.ecommerce AL SELECT
    const query = `
      SELECT 
        pe_estado.idpedido AS internalId,
        pe.FechaPedido, 
        pe.CodigoExterno AS externalCode,
        pe.ecommerce
      FROM pedidos_externos_estado pe_estado
      INNER JOIN pedidos_externos pe ON pe.ID = pe_estado.idpedido
      WHERE ISNULL(pe_estado.estado_envio, 0) = 0
        AND pe.deliveryCompany = 'SAMEX'
        AND pe_estado.estado = 'T'
      GROUP BY pe_estado.idpedido, pe.FechaPedido, pe.CodigoExterno, pe.ecommerce
      ORDER BY pe.FechaPedido DESC
    `;

    const { recordset } = await pool.request().query(query);
    console.log(`[PROCESAR-SAMEX] Encontrados ${recordset?.length || 0} pedidos pendientes`);
    
    const results: Array<any> = [];
    const errors: Array<any> = [];

    for (const row of recordset || []) {
      const internalId: number = row.internalId;
      const externalCode: string = row.externalCode;
      const ecommerce: string = row.ecommerce;

      try {

        
        console.log(`[PROCESAR-SAMEX] Procesando pedido ${externalCode} (ID: ${internalId}, Tienda: ${ecommerce})`);
        
        // 1) Traer la orden VTEX de la tienda correcta
        const order = await getOrderById(externalCode, ecommerce);
        const payload = mapVtexToSamex(order);

        // 2) Emitir en SAMEX a través de nuestro proxy
        const resp = await emitirSamex(payload);
        const { ot, etiquetaUrl, etiquetaKey, resultado, mensaje } = extractSamexData(resp);

        // Validar que obtuvimos un OT válido
        if (!ot) {
          throw new Error(`No se recibió número de envío de SAMEX. Resultado: ${resultado}, Mensaje: ${mensaje}`);
        }

        console.log(`[PROCESAR-SAMEX] OT generado: ${ot}${etiquetaUrl ? ' (con etiqueta)' : ''}`);

        // 3) Actualizar estado de envío
        await pool.request()
          .input('orderId', sql.Int, internalId)
          .query(`
            UPDATE pedidos_externos_estado
            SET estado_envio = 1,
                time_notificado = GETDATE()
            WHERE idpedido = @orderId
          `);

        // 4) Guardar OT y URL de seguimiento
        await pool.request()
          .input('nro', sql.VarChar(50), String(ot))
          .input('orderId', sql.Int, internalId)
          .query(`
            UPDATE pedidos_externos
            SET otDeliveryCompany = @nro,
                urlDeliveryCompany = CONCAT('https://mysamex.samex.cl/gts/pub/locNumSeguimiento.seam?tipo=E&localizador=', @nro)
            WHERE ID = @orderId
          `);

        results.push({ 
          internalId, 
          externalCode,
          ecommerce,
          ot, 
          hasLabel: !!etiquetaUrl,
          etiquetaUrl,
          success: true,
          mensaje: mensaje || 'Procesado correctamente'
        });

      } catch (err: any) {
        console.error(`[PROCESAR-SAMEX] Error en pedido ${externalCode} (${ecommerce}):`, err?.message);
        
        errors.push({ 
          internalId, 
          externalCode,
          ecommerce, 
          error: err?.message || 'Error desconocido',
          success: false 
        });

        // Marcar el pedido con error para revisión manual
        try {
          await pool.request()
            .input('orderId', sql.Int, internalId)
            .input('errorMsg', sql.VarChar(500), String(err?.message || 'Error').slice(0, 500))
            .query(`
              UPDATE pedidos_externos_estado
              SET estado_envio = -1,  -- -1 = error
                  observaciones = @errorMsg,
                  time_notificado = GETDATE()
              WHERE idpedido = @orderId
            `);
        } catch (dbErr) {
          console.error(`[PROCESAR-SAMEX] Error actualizando BD para pedido ${internalId}:`, dbErr);
        }
      }

      // Throttle para no saturar la API de SAMEX
      await new Promise(r => setTimeout(r, 1200));
    }

    // Resumen final
    const summary = {
      message: 'Proceso SAMEX completado',
      processed: results.length + errors.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log(`[PROCESAR-SAMEX] Finalizado. Exitosos: ${results.length}, Errores: ${errors.length}`);
    
    return res.status(200).json(summary);

  } catch (e: any) {
    console.error('[PROCESAR-SAMEX] Error crítico:', e);
    return res.status(500).json({ 
      error: e?.message || 'Error procesando pedidos',
      details: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  }
}