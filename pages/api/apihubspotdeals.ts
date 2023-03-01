import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

type Response = {
  success: boolean;
  data?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  try {
    const email = req.body.email ? req.body.email : req.query.email;
    const token = process.env.HUBSPOT_TOKEN; // reemplazar con el token válido
    // Realizar una solicitud de API de HubSpot con el token de acceso
    const url = `https://api.hubapi.com/crm/v3/objects/contact/search/`;
    const response = await axios({
      method: "POST",
      url: url,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        properties: [
          "firstname",
          "lastname",
          "email",
          "state",
          "rut",
          "mobilephone",
        ],
        filterGroups: [
          {
            filters: [
              {
                propertyName: "email",
                operator: "EQ",
                value: email,
              },
            ],
          },
        ],
        sorts: [
          {
            propertyName: "createdate",
            direction: "DESCENDING",
          },
        ],
      },
    });

    res.status(200).json({ success: true, data: response.data.results });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
}
