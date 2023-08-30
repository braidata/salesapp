import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

type Response = {
  success: boolean;
  data?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  try {
    const id = req.body.id;
    const token = process.env.HUBSPOT_TOKEN;
    const url = `https://api.hubapi.com/crm/v3/objects/company/search/`;
    const response = await axios({
      method: "POST",
      url: url,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        properties: [
          "razon_social",
          "giro_empresa",
          "rut_de_empresa",
          "name",
          "phone",
          "ciudad_facturacion",
          "zip",
          "comuna_facturacion",
          "region_facturacion",
          "calle",
          "casa_depto",
          "numero_direccion",
          "hubspot_owner_id",
          "hubspot_owner_assigneddate",
          "mobilephone",
        ],
        filterGroups: [
          {
            filters: [
              {
                propertyName: "hs_object_id",
                operator: "EQ",
                value: id,
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