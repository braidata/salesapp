export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    if (!req.body) {
      return res.status(400).json({ error: 'Datos requeridos' });
    }

    const response = await fetch(
      process.env.URL_EMISION,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rutEmpresaEmisora: process.env.RUT_EMPRESA_EMISORA,
          rutUsuarioEmisor: process.env.RUT_USUARIO_EMISOR,
          claveUsuarioEmisor: process.env.CLAVE_USUARIO_EMISOR,
          numeroCtaCte: process.env.NUMERO_CTA_CTE,
          dvNumeroCtaCte: process.env.DV_NUMERO_CTA_CTE,
          tipoEntrega: "2",
          tipoPago: "2",
          tipoServicio: "0",
          tipoDocumento1: "27",
          generaEtiquetaDocumento1: "N",
          valorDeclarado: "1000",
          tipoEncargo1: "29",
          ...req.body
        })
      }
    );

    const data = await response.json();
    console.log('Respuesta de Starken:', data);
    
    return res.status(200).json({
      message: "Conexión exitosa",
      data: data,
    });
  } catch (error) {
    console.error('Error en la emisión:', error);
    return res.status(error.response?.status || 500).json({
      message: "Error al conectar con Starken",
      error: error.message,
    });
  }
}