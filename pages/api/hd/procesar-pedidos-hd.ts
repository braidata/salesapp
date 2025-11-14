// pages/api/procesar-pedidos-hd.ts
// orchestrator_vtex → VTEX → Home Delivery Perú

import type { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';
import { getConnectionPool } from '../../../lib/db';
import { getOrderById } from '../../../lib/vtex';
import { mapVtexToHomeDelivery } from '../../../lib/homeDeliveryMapper';

const baseUrl = process.env.NEXTAUTH_URL || '';
const HD_DELIVERY_COMPANY = process.env.HD_DELIVERY_COMPANY || 'HOMEDELIVERYPE';
const HD_DIRECCION_ORIGEN_ID = Number(process.env.HD_DIRECCION_ORIGEN_ID || '8'); // pídelo a HD
const HD_CANAL_VENTA = process.env.HD_CANAL_VENTA || 'VTEX - VENTUS PERU';

if (!baseUrl) {
  // No tiramos error acá porque en build time no hay req/res
  console.warn('[HD-ORCHESTRATOR] Falta NEXTAUTH_URL en el entorno.');
}

async function emitirHomeDelivery(payload: any) {
  if (!baseUrl) {
    throw new Error('NEXTAUTH_URL no configurado para construir la URL interna.');
  }

  const resp = await fetch(`${baseUrl}api/hd/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await resp.json().catch(async () => ({ raw: await resp.text() }));

  if (!resp.ok) {
    throw new Error(`HomeDelivery error ${resp.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

function extractHdData(data: any): { success: boolean; message: string | null } {
  if (!data || typeof data !== 'object') {
    return { success: false, message: 'Respuesta HD inválida' };
  }

  // Formato esperado según DOC-API_CREACIÓN PEDIDOS:
  // { "success": true/false, "message": "..." }
  const success = Boolean((data as any).success);
  const message = (data as any).message ?? null;

  return { success, message };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  console.log('[PROCESAR-HD] Iniciando proceso batch Home Delivery Perú...');

  try {
    const pool = await getConnectionPool();

    const request = pool.request();
    request.input('deliveryCompany', sql.VarChar(50), HD_DELIVERY_COMPANY);

    const query = `
      SELECT 
        pe_estado.idpedido AS internalId,
        pe.FechaPedido, 
        pe.CodigoExterno AS externalCode,
        pe.ecommerce
      FROM pedidos_externos_estado pe_estado
      INNER JOIN pedidos_externos pe ON pe.ID = pe_estado.idpedido
      WHERE ISNULL(pe_estado.estado_envio, 0) = 0
        AND pe.deliveryCompany = @deliveryCompany
        AND pe_estado.estado = 'T'
      GROUP BY pe_estado.idpedido, pe.FechaPedido, pe.CodigoExterno, pe.ecommerce
      ORDER BY pe.FechaPedido DESC
    `;

    const { recordset } = await request.query(query);
    console.log(`[PROCESAR-HD] Encontrados ${recordset?.length || 0} pedidos pendientes`);

    const results: Array<any> = [];
    const errors: Array<any> = [];

    for (const row of recordset || []) {
      const internalId: number = row.internalId;
      const externalCode: string = row.externalCode;
      const ecommerce: string = row.ecommerce || 'ventusperu';

      try {
        console.log(
          `[PROCESAR-HD] Procesando pedido ${externalCode} (ID: ${internalId}, Tienda: ${ecommerce})`
        );

        // 1) Traer la orden VTEX de la tienda correcta (ventusperu para Perú)
        const order = await getOrderById(externalCode, ecommerce);

        // 2) Mapear VTEX → Home Delivery Perú (multibulto incluido en el mapper)
        const payload = mapVtexToHomeDelivery(order, {
          direccionOrigenId: HD_DIRECCION_ORIGEN_ID,
          canalVenta: HD_CANAL_VENTA,
        });

        const lpnGenerado =
          payload?.pedido?.lpn ||
          payload?.pedido?.orden_compra ||
          order?.orderId ||
          externalCode;

        // 3) Emitir pedido en Home Delivery vía nuestro proxy interno
        const resp = await emitirHomeDelivery(payload);
        const { success, message } = extractHdData(resp);

        if (!success) {
          throw new Error(
            `HomeDelivery devolvió error. Mensaje: ${message || 'Sin detalle'}`
          );
        }

        console.log(`[PROCESAR-HD] Pedido HD creado OK. LPN/Tracking: ${lpnGenerado}`);

        // 4) Actualizar estado de envío en la BD
        await pool
          .request()
          .input('orderId', sql.Int, internalId)
          .query(`
            UPDATE pedidos_externos_estado
            SET estado_envio = 1,
                time_notificado = GETDATE()
            WHERE idpedido = @orderId
          `);

        // 5) Guardar LPN / tracking en pedidos_externos
        await pool
          .request()
          .input('nro', sql.VarChar(100), String(lpnGenerado))
          .input('orderId', sql.Int, internalId)
          .query(`
            UPDATE pedidos_externos
            SET otDeliveryCompany = @nro
            WHERE ID = @orderId
          `);

        results.push({
          internalId,
          externalCode,
          ecommerce,
          lpn: lpnGenerado,
          success: true,
          message: message || 'Procesado correctamente',
        });
      } catch (err: any) {
        console.error(
          `[PROCESAR-HD] Error en pedido ${externalCode} (${ecommerce}):`,
          err?.message
        );

        errors.push({
          internalId,
          externalCode,
          ecommerce,
          error: err?.message || 'Error desconocido',
          success: false,
        });

        // Marcar el pedido con error para revisión manual
        try {
          await pool
            .request()
            .input('orderId', sql.Int, internalId)
            .input(
              'errorMsg',
              sql.VarChar(500),
              String(err?.message || 'Error').slice(0, 500)
            )
            .query(`
              UPDATE pedidos_externos_estado
              SET estado_envio = -1,  -- -1 = error
                  observaciones = @errorMsg,
                  time_notificado = GETDATE()
              WHERE idpedido = @orderId
            `);
        } catch (dbErr) {
          console.error(
            `[PROCESAR-HD] Error actualizando BD para pedido ${internalId}:`,
            dbErr
          );
        }
      }

      // Throttle para no matar la API de Home Delivery
      await new Promise((r) => setTimeout(r, 1200));
    }

    const summary = {
      message: 'Proceso Home Delivery completado',
      processed: results.length + errors.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log(
      `[PROCESAR-HD] Finalizado. Exitosos: ${results.length}, Errores: ${errors.length}`
    );

    return res.status(200).json(summary);
  } catch (e: any) {
    console.error('[PROCESAR-HD] Error crítico:', e);
    return res.status(500).json({
      error: e?.message || 'Error procesando pedidos Home Delivery',
      details: process.env.NODE_ENV === 'development' ? e.stack : undefined,
    });
  }
}
