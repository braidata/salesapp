// pages/api/actualizar-pedido.ts
import { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';
import { decodeBase64 } from '../../utils/decrypt';

const config = {
  user: process.env.AWS_SAP_USER,
  password: decodeBase64(process.env.AWS_SAP_PASSWORD || ''),
  server: process.env.AWS_SAP_SERVER,
  port: Number(process.env.AWS_SAP_PORT),
  database: process.env.AWS_SAP_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { pedido } = req.body;
  if (!pedido) {
    return res.status(400).json({ 
      message: 'Se requiere el id del pedido (CódigoExterno)' 
    });
  }

  let pool;
  try {
    pool = await sql.connect(config);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Actualizar qa_pedidos_externos: asignar la compañía de entrega "Starken"
      const updatePedidoResult = await transaction.request()
        .input('pedido', sql.NVarChar(255), pedido)
        .input('deliveryCompany', sql.NVarChar(255), 'Starken')
        .query(`
          UPDATE qa_pedidos_externos
          SET deliveryCompany = @deliveryCompany
          WHERE CodigoExterno = @pedido;
        `);

      if (updatePedidoResult.rowsAffected[0] === 0) {
        throw new Error('No se encontró el pedido en qa_pedidos_externos para actualizar');
      }

      // 2. Obtener el ID del pedido actualizado
      const pedidoResult = await transaction.request()
        .input('pedido', sql.NVarChar(255), pedido)
        .query(`
          SELECT ID FROM qa_pedidos_externos
          WHERE CodigoExterno = @pedido;
        `);

      if (!pedidoResult.recordset || pedidoResult.recordset.length === 0) {
        throw new Error('No se pudo obtener el ID del pedido');
      }
      const idPedido = pedidoResult.recordset[0].ID;

      // 3. Intentar actualizar qa_pedidos_externos_estado mediante JOIN
      const updateEstadoResult = await transaction.request()
        .input('pedido', sql.NVarChar(255), pedido)
        .input('estado_envio', sql.Int, 0)
        .input('estado', sql.NVarChar(10), 'T')
        .query(`
          UPDATE s
          SET s.estado_envio = @estado_envio,
              s.estado = @estado
          FROM qa_pedidos_externos_estado s
          INNER JOIN qa_pedidos_externos p ON p.ID = s.idpedido
          WHERE p.CodigoExterno = @pedido;
        `);

      let estadoAccion = 'actualizado';
      let estadoAffected = updateEstadoResult.rowsAffected[0];

      // 4. Si no se actualizó ningún registro, crear uno nuevo
      if (estadoAffected === 0) {
        const insertEstadoResult = await transaction.request()
          .input('idpedido', sql.Int, idPedido)
          .input('estado_envio', sql.Int, 0)
          .input('estado', sql.NVarChar(10), 'T')
          .query(`
            INSERT INTO qa_pedidos_externos_estado (idpedido, estado_envio, estado)
            VALUES (@idpedido, @estado_envio, @estado);
          `);
        estadoAccion = 'creado';
        estadoAffected = insertEstadoResult.rowsAffected[0];
      }

      await transaction.commit();

      res.status(200).json({ 
        message: 'Actualización exitosa',
        pedidoActualizado: updatePedidoResult.rowsAffected[0],
        estadoAccion: estadoAccion,
        estadoAffected: estadoAffected
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error: any) {
    console.error('Error en la actualización:', error);
    res.status(500).json({ 
      message: 'Error al actualizar los registros',
      error: error.message 
    });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
