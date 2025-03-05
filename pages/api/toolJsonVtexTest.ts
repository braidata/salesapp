// pages/api/toolJson.js

import { NextApiRequest, NextApiResponse } from 'next';
import { Connection, Request, TYPES } from 'tedious';

export default function handler(req, res) {
  if (req.method === 'GET') {
    const { codigoExterno } = req.query;

    // Configuración de la conexión
    const config = {
      server: process.env.SERVERC,
      authentication: {
        type: 'default',
        options: {
          userName: process.env.USERNAMEC,
          password: process.env.PASSWORDC,
        },
      },
      options: {
        database: process.env.DATABASEC,
        encrypt: false,
        trustServerCertificate: true,
        validateBulkLoadParameters: false,
        rowCollectionOnRequestCompletion: true,
      },
    };

    const connection = new Connection(config);

    connection.on('error', (err) => {
      console.error('Connection Error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error de conexión a la base de datos' });
      }
    });

    connection.on('connect', (err) => {
      if (err) {
        console.error('Connection Error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error de conexión a la base de datos' });
        }
        return;
      }

      let query;
      if (codigoExterno) {
        query = `
          SELECT *
          FROM EcommerceDB.dbo.VW_REVISION_PEDIDOS
          WHERE Ecommerce LIKE '%VTEX%' AND CODIGOEXTERNO = @codigoExterno
          ORDER BY inyeccion DESC
        `;
      } else {
        query = `
          SELECT TOP 1 *
          FROM EcommerceDB.dbo.VW_REVISION_PEDIDOS
          WHERE Ecommerce LIKE '%VTEX%'
          ORDER BY inyeccion DESC
        `;
      }

      const request = new Request(query, (err, rowCount, rows) => {
        if (err) {
          console.error('Query Error:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Error al ejecutar la consulta' });
          }
          connection.close();
          return;
        }

        if (rowCount === 0) {
          if (!res.headersSent) {
            res.status(404).json({ error: 'No se encontraron registros' });
          }
          connection.close();
          return;
        }

        const records = [];
        rows.forEach((columns) => {
          const record = {};
          columns.forEach((column) => {
            record[column.metadata.colName] = column.value;
          });
          records.push(record);
        });

        if (!res.headersSent) {
          res.status(200).json(records.length === 1 ? records[0] : records);
        }
        connection.close();
        return;
      });

      if (codigoExterno) {
        request.addParameter('codigoExterno', TYPES.VarChar, codigoExterno);
      }

      connection.execSql(request);
    });

    connection.connect();
  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
}