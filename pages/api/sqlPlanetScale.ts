//nextjs sql connector "SELECT CodigoExterno FROM pedidos_externos WHERE CodigoExterno BETWEEN 169666 AND 200000 AND pedidos_externos.Ecommerce='VENTUS'"

import { NextApiRequest, NextApiResponse } from "next";

import sql from "mssql";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
//   console.log(req.body.order);
//   const ord = req.body.order;
  const pool = new sql.ConnectionPool({
    user: process.env.DB_PANET_UNAME,
    password: process.env.DB_PLANET_PW,
    server: process.env.DB_PLANET_HOST,
    database: process.env.DB_PLANET,
    // options: {
    //   encrypt: false,
    //   trustServerCertificate: true,
    //   cryptoCredentialsDetails: {
    //     minVersion: "TLSv1",
    //   },
    // },
  });

  try {
    await pool.connect();
    const result = await pool
      .request()
      .query(`SELECT * FROM users`);
    res.status(200).json(result.recordset);
  } catch (err) {
    res.status(500);
    res.send(err);
  }
}

// Path: pages\api\sqlPlanetScale.jsx

//CREATE TABLE users (id INT NOT NULL AUTO_INCREMENT, name VARCHAR(255) NOT NULL, PRIMARY KEY (id));

//write data to planet scale mysql databas

// export default async function handler(req, res) {
//     const [rows, fields] = await pool.query("INSERT INTO users (name) VALUES ('John')");
//     res.status(200).json(rows);
// }
