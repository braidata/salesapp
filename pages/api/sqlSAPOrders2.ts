//nextjs sql connector "SELECT CodigoExterno FROM pedidos_externos WHERE CodigoExterno BETWEEN 169666 AND 200000 AND pedidos_externos.Ecommerce='VENTUS'"

import { NextApiRequest, NextApiResponse } from 'next'

const sql = require('mssql')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const id = req.body.id ? req.body.id : req.query.id;
    const alm = req.body.alm;
    const minIdsap = req.body.minIdsap ? req.body.minIdsap : req.query.startDate
    ; // Asegúrate de recibir las fechas en el formato correcto
    const maxIdsap = req.body.maxIdsap ? req.body.maxIdsap : req.query.endDate;
    const ecommerceFilter = req.body.ecommerce ? req.body.ecommerce : req.query.ecommerce;
    const pool = new sql.ConnectionPool
    ({
        user: process.env.USERNAMEC,
        password: process.env.PASSWORDC,
        server: process.env.SERVERC,
        database: process.env.DATABASEC,
        options: {
            encrypt: false,
            trustServerCertificate: true,
            cryptoCredentialsDetails: {
                minVersion: 'TLSv1'
            }
        }
    })

    try {
        await pool.connect();
        const result = await pool.request()
            .query(`
                SELECT CodigoInterno, CodigoExterno, respuesta_sap, RESULTADO_SAP, RUTA, ts, ecommerce 
                FROM VISTA_INTEGRACION_SAP 
                WHERE 
                ${ecommerceFilter ? `ecommerce = '${ecommerceFilter}'` : ''}
                AND ts BETWEEN '${minIdsap}' AND '${maxIdsap}'
                ORDER BY CodigoInterno DESC
            `);

        res.status(200).json(result.recordset);
    } catch (err) {
        res.status(500);
        res.send(err);
    }
}