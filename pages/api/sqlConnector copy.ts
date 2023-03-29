//nextjs sql connector "SELECT CodigoExterno FROM pedidos_externos WHERE CodigoExterno BETWEEN 169666 AND 200000 AND pedidos_externos.Ecommerce='VENTUS'"

import { NextApiRequest, NextApiResponse } from 'next'

const sql = require('mssql')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log(req.body.order)
    const ord = req.body.order
    const pool = new sql.ConnectionPool
    ({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
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
            .query(`SELECT CodigoExterno, CodigoInterno, Estado, NumeroDocumento, NombreCliente, DireccionDespacho,CodigoComuna, NumeroDocumento, TipoDocumento, RutCliente, Email, Telefono FROM pedidos_externos WHERE CodigoExterno=${ord} AND pedidos_externos.Ecommerce='VENTUS'`)
        res.status(200).json(result.recordset)
    } catch (err) {
        res.status(500)
        res.send(err)
    }
}



//NombreRetiro,	RutRetiro,


