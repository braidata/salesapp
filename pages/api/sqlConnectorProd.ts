//nextjs sql connector "SELECT CodigoExterno FROM pedidos_externos WHERE CodigoExterno BETWEEN 169666 AND 200000 AND pedidos_externos.Ecommerce='VENTUS'"

import { NextApiRequest, NextApiResponse } from 'next'

const sql = require('mssql')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    //console.log(req.body.sku)
    const sku = req.body.sku

    //console.log(req.body.alm)
    const alm = req.body.alm

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
            .query(`SELECT Stock.Cod_Producto, Stock.Nom_Producto, Stock.Unidades, (CASE  WHEN Stock.stk_Comprometido<'0' THEN Stock.stk_Comprometido*'-1' ELSE Stock.stk_Comprometido END) AS CompREAL, (Stock.Unidades - (CASE  WHEN Stock.stk_Comprometido<'0' THEN Stock.stk_Comprometido*'-1' ELSE Stock.stk_Comprometido END)) AS REAL FROM IMEGADB.dbo.Stock Stock WHERE Stock.Cod_Producto='${sku}' AND Stock.Almacen='${alm}' AND Stock.Año='2022' AND Stock.Mes='11'`)
        res.status(200).json(result.recordset)
    } catch (err) {
        res.status(500)
        res.send(err)
    }
}