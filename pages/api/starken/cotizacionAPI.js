export default async function handler(req, res) {
  const headers = {
    'Content-Type': 'application/json',
    'rut': process.env.RUT_EMPRESA_EMISORA,
    'clave': process.env.CLAVE_EMPRESA_COTIZADOR
  };

  const comunasSantiago = [
    { codigoCiudad: "A", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "CERRILLOS" },
    { codigoCiudad: "B", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "CERRO NAVIA" },
    { codigoCiudad: "C", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "CONCHALI" },
    { codigoCiudad: "D", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "EL BOSQUE" },
    { codigoCiudad: "E", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "ESTACION CENTRAL" },
    { codigoCiudad: "F", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "HUECHURABA" },
    { codigoCiudad: "G", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "INDEPENDENCIA" },
    { codigoCiudad: "H", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "LA CISTERNA" },
    { codigoCiudad: "I", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "LA FLORIDA" },
    { codigoCiudad: "J", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "LA GRANJA" },
    { codigoCiudad: "K", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "LA PINTANA" },
    { codigoCiudad: "L", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "LA REINA" },
    { codigoCiudad: "M", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "LAS CONDES" },
    { codigoCiudad: "N", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "LO BARNECHEA" },
    { codigoCiudad: "O", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "LO ESPEJO" },
    { codigoCiudad: "P", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "LO PRADO" },
    { codigoCiudad: "Q", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "MACUL" },
    { codigoCiudad: "S", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "MAIPU" },
    { codigoCiudad: "R", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "NUNOA" },
    { codigoCiudad: "T", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "PEDRO AGUIRRE CERDA" },
    { codigoCiudad: "V", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "PROVIDENCIA" },
    { codigoCiudad: "Y", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "PUDAHUEL" },
    { codigoCiudad: "X", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "PUENTE ALTO" },
    { codigoCiudad: "Z", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "QUILICURA" },
    { codigoCiudad: "AA", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "QUINTA NORMAL" },
    { codigoCiudad: "AB", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "RECOLETA" },
    { codigoCiudad: "AC", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "RENCA" },
    { codigoCiudad: "AD", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "SAN BERNARDO" },
    { codigoCiudad: "AE", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "SAN JOAQUIN" },
    { codigoCiudad: "AG", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "SAN MIGUEL" },
    { codigoCiudad: "AH", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "SAN RAMON" },
    { codigoCiudad: "AI", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "VITACURA" },
    { codigoCiudad: "AJ", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "SANTIAGO CENTRO" },
    { codigoCiudad: "AK", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "PENALOLEN" },
    { codigoCiudad: "AL", codigoRegion: 13, codigoZonaGeografica: 4, nombreCiudad: "LA DEHESA" }
  ];

  try {
    if (req.method === 'GET') {
      const tipo = req.query.tipo;
      const endpoint = tipo === 'origen' ? process.env.URL_CIUDADES_ORIGEN : process.env.URL_CIUDADES_DESTINO;
      const response = await fetch(endpoint, { method: 'GET', headers });
      const data = await response.json();
      
      // Agregar comunas de Santiago sin importar si es origen o destino
      const listKey = tipo === 'origen' ? 'listaCiudadesOrigen' : 'listaCiudadesDestino';
      if (data[listKey]) {
        data[listKey].push(...comunasSantiago);
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