// pages/api/toolJson.js

import { NextApiRequest, NextApiResponse } from 'next';
import { Connection, Request, TYPES } from 'tedious';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { idPedido } = req.body;

    if (!idPedido) {
      res.status(400).json({ error: 'Falta el parámetro idPedido' });
      return;
    }

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

    function cleanJsonString(jsonString) {
      jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
      jsonString = jsonString.replace(/\\\\/g, '\\');
      jsonString = jsonString.replace(/[^\x20-\x7E]+/g, '');
      return jsonString;
    }

    function processLogcliente(logcliente) {
      const parts = logcliente.split('|', 2);
      let firstPart;
      try {
        firstPart = JSON.parse(parts[0]);
      } catch (e) {
        firstPart = { error: 'Error al procesar la primera parte del logcliente' };
      }
      const secondPart = parts[1] || '';
      return { data: firstPart, response: secondPart };
    }

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

      const query = `
        SELECT CodigoInterno2, idpedido, CODIGOEXTERNO, idsap, logcliente, logsap
        FROM EcommerceDB.dbo.VW_REVISION_PEDIDOS
        WHERE CODIGOEXTERNO = @idPedido
      `;

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
            res.status(404).json({ error: 'No se encontraron registros con ese idpedido' });
          }
          connection.close();
          return;
        }

        const record = {};
        rows.forEach((columns) => {
          columns.forEach((column) => {
            record[column.metadata.colName] = column.value;
          });
        });

        const codigo_interno = record.CodigoInterno2;
        const idpedido = record.idpedido;
        const idsap = record.idsap;
        const logcliente = record.logcliente;
        const logsap = record.logsap;

        if (!logcliente) {
          console.error('logcliente es undefined o null');
          if (!res.headersSent) {
            res.status(500).json({ error: 'El campo logcliente está vacío' });
          }
          connection.close();
          return;
        }

        const jsoncliente = processLogcliente(logcliente);

        let jsonpedido;
        try {
          const cleanedLogsap = cleanJsonString(logsap);
          jsonpedido = JSON.parse(cleanedLogsap);
        } catch (e) {
          console.error(`Error al decodificar JSON del pedido: ${e}`);
          jsonpedido = { error: 'Error al decodificar logsap' };
        }

        const responseData = {
          codigo_interno,
          idpedido,
          idsap,
          jsoncliente,
          jsonpedido,
        };

        if (!res.headersSent) {
          res.status(200).json(responseData);
        }
        connection.close();
        return;
      });

      request.addParameter('idPedido', TYPES.VarChar, idPedido);
      connection.execSql(request);
    });

    connection.connect();
  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
}
