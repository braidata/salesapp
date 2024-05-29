import mysql from 'mysql2/promise';

const checkConnection = async (req, res) => {
  let connection;
  let passworddb = process.env.DATABASE_MYSQL

  try {
    
    connection = await mysql.createConnection({
      host: 'ventus-sale.c52u0o4uwo8n.us-east-1.rds.amazonaws.com',
      port: 3306,
      user: 'ventus_sale_user',
      password: passworddb,
      database: 'ventus_sales_db', 
    });

  
    await connection.query('SELECT 1');

    res.status(200).json({ message: 'Conexión exitosa a la base de datos' });
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);

    if (error.code === 'ETIMEDOUT') {
 
      res.status(500).json({ error: 'Tiempo de espera agotado al conectar a la base de datos' });
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      
      res.status(401).json({ error: 'Error de autenticación al conectar a la base de datos' });
    } else {
      res.status(500).json({ error: 'Error al conectar a la base de datos' });
    }
  } finally {
    // cierarr
    if (connection) {
      try {
        await connection.end();
      } catch (error) {
        console.error('Error al cerrar la conexión:', error);
      }
    }
  }
};

export default checkConnection;

