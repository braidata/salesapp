// pages/api/starken/seguimientoAPI.js
export default async function handler(req, res) {
  const headers = {
    'Content-Type': 'application/json',
    'rut': process.env.RUT_EMPRESA_EMISORA,
    'clave': process.env.CLAVE_EMPRESA_COTIZADOR
  };

  try {
    // 1. Tracking Unitario
    if (req.method === 'GET' && req.query.tipo === 'unitario') {
      const { ordenFlete } = req.query;

      if (!ordenFlete) {
        return res.status(400).json({
          message: "Se requiere el número de orden de flete"
        });
      }

      const response = await fetch(
        process.env.URL_SEGUIMIENTO_DETALLE,
        {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            ordenFlete: ordenFlete
          })
        }
      );

      const data = await response.json();
      return res.status(200).json(data);
    }

    // 2. Tracking Masivo
    if (req.method === 'POST' && req.query.tipo === 'masivo') {
      const { ordenes } = req.body;

      if (!ordenes || !Array.isArray(ordenes)) {
        return res.status(400).json({
          message: "Se requiere un array de órdenes de flete"
        });
      }

      const body = {
        listaSeguimientos: ordenes.map(orden => ({
          numeroOrdenFlete: orden
        }))
      };

      const response = await fetch(
        process.env.URL_SEGUIMIENTO,
        {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(body)
        }
      );

      const data = await response.json();
      return res.status(200).json(data);
    }

    // 3. Tracking Empresa con DD
    if (req.method === 'POST' && req.query.tipo === 'dd') {
      const { documentos } = req.body;

      if (!documentos || !Array.isArray(documentos)) {
        return res.status(400).json({
          message: "Se requiere un array de documentos"
        });
      }

      const body = {
        listaSeguimientos: documentos.map(doc => ({
          numeroDocumento: doc.numero,
          tipoDocumento: doc.tipo || 0,
          tipoDocumentoCliente: doc.tipoCliente || 0,
          ctaCteCliente: doc.ctaCte
        }))
      };

      const response = await fetch(
        process.env.URL_SEGUIMIENTO_DD,
        {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(body)
        }
      );

      const data = await response.json();
      return res.status(200).json(data);
    }

    // 4. Tracking con Redestinación (SOAP)
    if (req.method === 'POST' && req.query.tipo === 'redestinacion') {
      const { tracking, rutEmpresa } = req.body;
      
      // No validamos el JSON, sino que esperamos los campos necesarios para el XML
      const soapBody = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ejb="http://ejb.tracking.egt.cl/">
          <soapenv:Header/>
          <soapenv:Body>
            <ejb:resumenTrackingCargaRedestinacion>
              <tracking>
                <numeroDocumento>${tracking?.numeroDocumento || ''}</numeroDocumento>
                <numeroOrdenFlete>${tracking?.numeroOrdenFlete || ''}</numeroOrdenFlete>
                <tipoDocumento>${tracking?.tipoDocumento || ''}</tipoDocumento>
              </tracking>
              <rutEmpresa>${rutEmpresa}</rutEmpresa>
            </ejb:resumenTrackingCargaRedestinacion>
          </soapenv:Body>
        </soapenv:Envelope>
      `;
    
      const response = await fetch(
        process.env.URL_SEGUIMIENTO_ET,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml',
            'SOAPAction': ''
          },
          body: soapBody
        }
      );
    
      const data = await response.text();
      return res.status(200).json({
        message: "Respuesta SOAP recibida",
        data: data
      });
    }

    return res.status(405).json({ message: "Método no permitido o tipo de seguimiento inválido" });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      message: "Error al procesar la solicitud",
      error: error.message
    });
  }
}