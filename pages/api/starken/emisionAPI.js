export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }
  
    try {
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
            rutDestinatario: "",
            dvRutDestinatario: "",
            nombreRazonSocialDestinatario: "Juan",
            apellidoPaternoDestinatario: "Pérez",
            apellidoMaternoDestinatario: "González",
            direccionDestinatario: "Calle Test",
            numeracionDireccionDestinatario: "123",
            departamentoDireccionDestinatario: "",
            comunaDestino: "VIÑA DEL MAR",
            telefonoDestinatario: "912345678",
            emailDestinatario: "juan@test.cl",
            nombreContactoDestinatario: "Juan",
            tipoEntrega: "2",
            tipoPago: "2",
            numeroCtaCte: process.env.NUMERO_CTA_CTE,
            dvNumeroCtaCte: process.env.DV_NUMERO_CTA_CTE,
            centroCostoCtaCte: "0",
            valorDeclarado: "1000",
            contenido: "Documentos",
            kilosTotal: "1.5",
            alto: "10",
            ancho: "20",
            largo: "30",
            tipoServicio: "0",
            tipoDocumento1: "27",
            numeroDocumento1: "12345",
            generaEtiquetaDocumento1: "N",
            tipoDocumento2: "",
            numeroDocumento2: "",
            generaEtiquetaDocumento2: "",
            tipoDocumento3: "",
            numeroDocumento3: "",
            generaEtiquetaDocumento3: "",
            tipoDocumento4: "",
            numeroDocumento4: "",
            generaEtiquetaDocumento4: "",
            tipoDocumento5: "",
            numeroDocumento5: "",
            generaEtiquetaDocumento5: "",
            tipoEncargo1: "29",
            cantidadEncargo1: "1",
            tipoEncargo2: "",
            cantidadEncargo2: "",
            tipoEncargo3: "",
            cantidadEncargo3: "",
            tipoEncargo4: "",
            cantidadEncargo4: "",
            tipoEncargo5: "",
            cantidadEncargo5: "",
            ciudadOrigenNom: "SANTIAGO",
            observacion: "PRUEBA EMISION",
            codAgenciaOrigen: "",
            latitud: "",
            longitud: "",
            precisión: "",
            calidad: "",
            match: ""
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