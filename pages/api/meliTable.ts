import { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const ord = req.body.order ? req.body.order : req.query.order;
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;
    const server = process.env.DB_HOST;
    const database = process.env.DB_DATABASE;
    
    if (!user || !password || !server || !database) {
      throw new Error('Las variables de entorno de la base de datos no están definidas');
    }
    
    const pool = new sql.ConnectionPool({
      user,
      password,
      server,
      database,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        cryptoCredentialsDetails: {
          minVersion: 'TLSv1',
        },
      },
    });

    try {
        await pool.connect()
        const result = await pool.request()
            .query(`SELECT CodigoExterno FROM pedidos_externos WHERE CodigoExterno='${ord}'`)
        res.status(200).json(result.recordset)
        console.log(result.recordset)
    } catch (err) {
        res.status(500)
        res.send(err)
    } finally
    {
        pool.close()
    }
}


