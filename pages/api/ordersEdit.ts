import { NextApiRequest, NextApiResponse } from 'next'

const sql = require('mssql')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    //const { order,rutCliente } = req.body;
    const order = 20091;
    const rutCliente = '76709793K';
    const pool = new sql.ConnectionPool({
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
    });

    try {
        await pool.connect();

        const result = await pool.request()
            .input('codigoExterno', sql.Int, order)
            .input('rutCliente', sql.NVarChar, rutCliente)
            .query(`
                UPDATE pedidos_externos 
                SET RutCliente = @rutCliente
                WHERE CodigoExterno = @codigoExterno AND Ecommerce = 'Blanik'
            `);

        res.status(200).json(result.rowsAffected);
    } catch (err) {
        res.status(500).send(err);
    } finally {
        pool.close();
    }
}

//component to send a bulk of data to this api


// 20087- 175827595
// 20089-197871539
// 20090-44652234
// 20091-76709793K