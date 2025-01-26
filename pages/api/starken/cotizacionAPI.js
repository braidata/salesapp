export default async function handler(req, res) {
  // Configuración de credenciales en headers
  const headers = {
    'Content-Type': 'application/json',
    'rut': process.env.RUT_EMPRESA_EMISORA,
    'clave': process.env.CLAVE_EMPRESA_COTIZADOR
  };

  try {
    // GET request para ciudades
    if (req.method === 'GET') {
      const tipo = req.query.tipo;
      
      const endpoint = tipo === 'origen' 
        ? process.env.URL_CIUDADES_ORIGEN
        : process.env.URL_CIUDADES_DESTINO;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: headers
      });

      const data = await response.json();
      return res.status(200).json({
        message: `Ciudades de ${tipo} obtenidas exitosamente`,
        data: data
      });
    }

    // POST request para cotización
    if (req.method === 'POST') {
      const { bultos, ciudadOrigen, ciudadDestino } = req.body;

      // Validar datos requeridos
      if (!bultos || !ciudadOrigen || !ciudadDestino) {
        return res.status(400).json({
          message: "Faltan datos requeridos"
        });
      }

      // Procesar múltiples bultos según documentación
      const pesoTotal = bultos.reduce((sum, bulto) => sum + Number(bulto.peso), 0);
      const largoTotal = bultos.reduce((sum, bulto) => sum + Number(bulto.largo), 0);
      const anchoMax = Math.max(...bultos.map(bulto => Number(bulto.ancho)));
      const altoMax = Math.max(...bultos.map(bulto => Number(bulto.alto)));

      const cotizacionData = {
        codigoCiudadOrigen: ciudadOrigen,
        codigoCiudadDestino: ciudadDestino,
        codigoAgenciaDestino: 0,
        codigoAgenciaOrigen: 0,
        alto: altoMax,
        ancho: anchoMax,
        largo: largoTotal,
        kilos: pesoTotal,
        cuentaCorriente: process.env.NUMERO_CTA_CTE,
        cuentaCorrienteDV: process.env.DV_NUMERO_CTA_CTE,
        rutCliente: "" // para tarifas al rut process.env.RUT_USUARIO_EMISOR
      };

      console.log('Datos de cotización:', cotizacionData);

      const response = await fetch(
        process.env.URL_COTIZADOR,
        {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(cotizacionData)
        }
      );

      const data = await response.json();
      return res.status(200).json({
        message: "Cotización exitosa",
        data: data
      });
    }

    return res.status(405).json({ message: "Método no permitido" });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      message: "Error en el servidor",
      error: error.message
    });
  }
}