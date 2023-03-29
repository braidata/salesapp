import { NextApiRequest, NextApiResponse } from 'next';
const sql = require('mssql');

const pedidosArray = [
    "BK-20544",
    "BK-20545",
    "BK-20546",
    "BK-20548",
    "BK-20549",
    "BK-20550",
    "BK-20552",
    "BK-20553",
    "BK-20554",
    "BK-20555",
    "BK-20556",
    "BK-20559",
    "BK-20560",
    "BK-20561",
    "BK-20562",
    "BK-20564",
    "BK-20565",
    "BK-20566",
    "BK-20568",
    "BK-20569",
    "BK-20570",
    "BK-20571",
    "BK-20572",
    "BK-20573",
    "BK-20575",
    "BK-20576",
    "BK-20577",
  ];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const  pedidos  = pedidosArray;

  const pool = new sql.ConnectionPool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      cryptoCredentialsDetails: {
        minVersion: 'TLSv1',
      },
    },
  });

  try {
    await pool.connect();

    console.log('Updating rows for pedidos:', pedidos);
    const transaction = pool.transaction();

    // Begin a transaction
    await transaction.begin();

    for (let i = 0; i < pedidos.length; i++) {
        const CodigoExterno = pedidos[i];
        await transaction
          .request()
          .input('CodigoExterno', sql.NVarChar, CodigoExterno)
          .query(
            "UPDATE pedidos_externos SET TipoDocumento = 'B' WHERE CodigoExterno = @CodigoExterno AND pedidos_externos.Ecommerce='BLANIK'"
          );
      }

    // Commit the transaction
    await transaction.commit();

    res.status(200).json({ message: 'Rows updated successfully' });
  } catch (err) {
    res.status(500);
    res.send(err);
  } finally {
    pool.close();
  }
}