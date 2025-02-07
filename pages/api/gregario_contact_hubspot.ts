import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;

// Middleware de autenticación basado en tu código original
function withProtection(handler: Function) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Token no proporcionado' });
      }

      const token = authHeader.split(' ')[1];

      try {
        jwt.verify(token, JWT_SECRET);
        return handler(req, res);
      } catch (error) {
        return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
      }
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Error en la autenticación' });
    }
  };
}

// 🔹 Función principal basada en tu código original
async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const token = process.env.HUBSPOT_TOKEN;

    // 📌 1️⃣ Obtener datos del contacto desde Gregario
    const contactResponse = await axios.get(`https://test-ventus-sales.ventuscorp.cl/api/gregario_contact_unitario?id=${id}`);
    const contactData = contactResponse.data.contact.results;

    // Verificar si el contacto tiene coordenadas
    if (!contactData.latitude || !contactData.longitude) {
      return res.status(400).json({ success: false, error: 'El contacto no tiene coordenadas registradas' });
    }

    // 📌 2️⃣ Obtener datos de ubicación desde tu API
    const geoResponse = await axios.get(
      `https://test-ventus-sales.ventuscorp.cl/api/geo?lat=${contactData.latitude}&lon=${contactData.longitude}`
    );

    const { localidad, detalles } = geoResponse.data;

    // 📌 3️⃣ Extraer datos útiles para HubSpot
    const comuna = detalles.town || detalles.city || detalles.municipality || detalles.county || 'Desconocida';
    const region = detalles.state || 'Desconocida';
    const codigoPostal = detalles.postcode || '';
    const pais = detalles.country || 'Chile';
    const calle = detalles.road || '';
    const numero = detalles.house_number || '';

    // 🔹 **Cambio clave:** Usar `address` de Gregario en vez de la API de geolocalización
    const direccion = contactData.address || 'Dirección no disponible';

    // 📌 4️⃣ Preparar datos de empresa en HubSpot
    const companyData = {
      properties: {
        name: `${contactData.name} - Gregario Integration`,
        razon_social: contactData.name,
        phone: contactData.phones[0]?.replace(/['"]/g, '') || '',
        description: `Gregario Integration ID: ${contactData.id} \n Coordenadas: ${contactData.latitude}, ${contactData.longitude} \n Código: ${contactData.code} Desc: ${contactData.description}`,
        industry: 'FOOD_BEVERAGES',
        address: direccion,
        calle: calle,
        numero_direccion: numero,
        city: comuna,
        state: region,
        country: pais,
        zip: codigoPostal
      },
    };

    // 📌 5️⃣ Crear empresa en HubSpot
    const companyResponse = await axios.post(
      'https://api.hubapi.com/crm/v3/objects/companies',
      companyData,
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // 📌 6️⃣ Preparar datos de contacto en HubSpot
    const contactHubspotData = {
      properties: {
        email: contactData.emails[0] || '',
        firstname: contactData.name,
        phone: contactData.phones[0]?.replace(/['"]/g, '') || '',
        mobilephone: contactData.phones[0]?.replace(/['"]/g, '') || '',
        address: direccion,
        city: comuna,
        state: region,
        country: pais,
        hs_analytics_source: 'OTHER_CAMPAIGNS',
        canal: 'GREGARIO',
        zip: codigoPostal
      },
    };

    // 📌 7️⃣ Crear contacto en HubSpot
    const contactHubspotResponse = await axios.post(
      'https://api.hubapi.com/crm/v3/objects/contacts',
      contactHubspotData,
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // 📌 8️⃣ Asociar contacto con empresa en HubSpot
    await axios.put(
      `https://api.hubapi.com/crm/v3/objects/companies/${companyResponse.data.id}/associations/contacts/${contactHubspotResponse.data.id}/company_to_contact`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // ✅ Respuesta exitosa
    return res.status(200).json({
      success: true,
      data: {
        company: companyResponse.data,
        contact: contactHubspotResponse.data,
      },
    });

  } catch (error) {
    console.error('Error:', error.response?.data || error);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
}

// Exportar handler protegido
export default withProtection(handler);
