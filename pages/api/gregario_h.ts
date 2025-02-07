import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const token = process.env.HUBSPOT_TOKEN;
    const companyId = "6138291886";
    
    // 1. Obtener datos de la empresa
    const companyResponse = await axios({
      method: "GET",
      url: `https://api.hubapi.com/crm/v3/objects/companies/${companyId}`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params: {
        properties: [
          'name',
          'domain',
          'industry',
          'description',
          'phone',
          'address',
          'city',
          'country',
          'zip',
          'state',
          'website',
          'numberofemployees',
          'annualrevenue',
          'type',
          'hubspot_owner_id'
        ]
      }
    });

    // 2. Obtener IDs de contactos asociados
    const contactsAssociationResponse = await axios({
      method: "GET",
      url: `https://api.hubapi.com/crm/v3/objects/companies/${companyId}/associations/contacts`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    // 3. Obtener detalles de cada contacto
    const contactsDetails = await Promise.all(
      contactsAssociationResponse.data.results.map(async (contact) => {
        const contactResponse = await axios({
          method: "GET",
          url: `https://api.hubapi.com/crm/v3/objects/contacts/${contact.id}`,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          params: {
            properties: [
              'email',
              'firstname',
              'lastname',
              'phone',
              'mobilephone',
              'jobtitle',
              'hs_object_id',
              'createdate',
              'lastmodifieddate'
            ]
          }
        });
        return contactResponse.data;
      })
    );

    // 4. Combinar toda la información
    return res.status(200).json({
      company: companyResponse.data,
      contacts: contactsDetails
    });

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
}