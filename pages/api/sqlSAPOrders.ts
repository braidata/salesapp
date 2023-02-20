//nextjs sql connector "SELECT CodigoExterno FROM pedidos_externos WHERE CodigoExterno BETWEEN 169666 AND 200000 AND pedidos_externos.Ecommerce='VENTUS'"

import { NextApiRequest, NextApiResponse } from 'next'

const sql = require('mssql')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    //console.log(req.body.sku)
    const id = req.body.id ? req.body.id : req.query.id

    //console.log(req.body.alm)
    const alm = req.body.alm

    const pool = new sql.ConnectionPool
    ({
        user: process.env.DB_USER2,
        password: process.env.DB_PASSWORD2,
        server: process.env.DB_HOST2,
        database: process.env.DB_DATABASE2,
        options: {
            encrypt: false,
            trustServerCertificate: true,
            cryptoCredentialsDetails: {
                minVersion: 'TLSv1'
            }
        }
    })

    try {
        await pool.connect()
        const result = await pool.request()
            .query(`SELECT idsap, CodigoExterno, respuesta_sap, RESULTADO_SAP, RUTA FROM VISTA_INTEGRACION_SAP WHERE ecommerce='VENTUS'  AND ts > '2023-02-15T00:00:00.000Z'`)
            // query to see all the columns names
            //.query(`SELECT * FROM IMEGADB.dbo.Stock Stock WHERE Stock.Cod_Producto='${sku}' AND CodigoExterno='${id}' AND Stock.Almacen='${alm}' AND Stock.Año='2022' AND Stock.Mes='11'`)
        //console.log(result.recordset)

            res.status(200).json(result.recordset)
    } catch (err) {
        res.status(500)
        res.send(err)
    }
}