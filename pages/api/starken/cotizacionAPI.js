export default async function handler(req, res) {
  const headers = {
    'Content-Type': 'application/json',
    'rut': process.env.RUT_EMPRESA_EMISORA,
    'clave': process.env.CLAVE_EMPRESA_COTIZADOR
  };

  const comunasSantiago = [
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "CERRILLOS" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "CERRO NAVIA" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "CONCHALI" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "EL BOSQUE" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "ESTACION CENTRAL" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "HUECHURABA" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "INDEPENDENCIA" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "LA CISTERNA" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "LA FLORIDA" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "LA GRANJA" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "LA PINTANA" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "LA REINA" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "LAS CONDES" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "LO BARNECHEA" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "LO ESPEJO" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "LO PRADO" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "MACUL" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "MAIPU" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "NUNOA" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "PEDRO AGUIRRE CERDA" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "PROVIDENCIA" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "PUDAHUEL" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "PUENTE ALTO" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "QUILICURA" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "QUINTA NORMAL" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "RECOLETA" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "RENCA" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "SAN BERNARDO" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "SAN JOAQUIN" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "SAN MIGUEL" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "SAN RAMON" },
    { codigoCiudad: 1, codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "VITACURA" }
  ];

  try {
    if (req.method === 'GET') {
      const tipo = req.query.tipo;
      const endpoint = tipo === 'origen' ? process.env.URL_CIUDADES_ORIGEN : process.env.URL_CIUDADES_DESTINO;
      const response = await fetch(endpoint, { method: 'GET', headers });
      const data = await response.json();
      
      // Agregar comunas de Santiago a la lista
      if (data.listaCiudadesOrigen) {
        data.listaCiudadesOrigen.push(...comunasSantiago);
      }

      return res.status(200).json({
        message: `Ciudades de ${tipo} obtenidas exitosamente`,
        data: data
      });
    }

    if (req.method === 'POST') {
      const { bultos, ciudadOrigen, ciudadDestino } = req.body;
      if (!bultos || !ciudadOrigen || !ciudadDestino) {
        return res.status(400).json({ message: "Faltan datos requeridos" });
      }

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
        rutCliente: ""
      };

      const response = await fetch(process.env.URL_COTIZADOR, {
        method: 'POST',
        headers,
        body: JSON.stringify(cotizacionData)
      });
      
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