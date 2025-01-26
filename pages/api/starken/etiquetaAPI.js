// pages/api/starken/etiquetaAPI.js
export default async function handler(req, res) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(process.env.CLAVE_ETIQUETAS).toString('base64')}`
    };
  
    try {
      if (req.method === 'POST') {
        const { ordenFlete, tipoSalida = 2 } = req.body;
  
        if (!ordenFlete) {
          return res.status(400).json({
            message: "Se requiere el número de orden de flete",
            status: 400
          });
        }
  
        // Hacer el request a la API de Starken
        const response = await fetch(
          process.env.URL_ETIQUETA + 
          new URLSearchParams({
            ordenFlete: ordenFlete,
            tipoSalida: tipoSalida // 1: PDF Base64, 2: ZPL, 3: PDF URL
          }),
          {
            method: 'POST',
            headers: headers
          }
        );
  
        const data = await response.json();
  
        // Verificar si la respuesta es exitosa
        if (data.status !== 200) {
          throw new Error(data.message || 'Error al generar etiqueta');
        }
  
        return res.status(200).json({
          message: data.message,
          data: data.data,
          status: data.status
        });
      }
  
      return res.status(405).json({
        message: "Método no permitido",
        status: 405
      });
  
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({
        message: "Error al procesar la solicitud",
        error: error.message,
        status: 500
      });
    }
  }