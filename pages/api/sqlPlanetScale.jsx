//connect to planet scale mysql database
import { createPool } from "mysql2/promise";
const pool = createPool({
    host: process.env.DB_PLANET_HOST, // PlanetScale host
    user: process.env.DB_PANET_UNAME, // PlanetScale user
    password: process.env.DB_PLANET_PW, // PlanetScale password
    database: process.env.DB_PLANET, // PlanetScale database
});

export default async function handler(req, res) {
    const [rows, fields] = await pool.query("INSERT INTO users (name) VALUES ('John')");
    res.status(200).json(rows);
}

// Path: pages\api\sqlPlanetScale.jsx

//CREATE TABLE users (id INT NOT NULL AUTO_INCREMENT, name VARCHAR(255) NOT NULL, PRIMARY KEY (id));

//write data to planet scale mysql databas

// export default async function handler(req, res) {
//     const [rows, fields] = await pool.query("INSERT INTO users (name) VALUES ('John')");
//     res.status(200).json(rows);
// }

