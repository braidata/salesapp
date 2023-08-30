import type { NextApiRequest, NextApiResponse } from "next";
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
    const id = req.body.id || req.query.id;
    const url = `https://api.hubapi.com/crm/v3/objects/line_item/search/`;
    const response = await axios({
      method: "POST",
      url: url,
      headers: {
        Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`,
      },
      data: {
        properties: ["name", "amount", "quantity", "hs_sku", "hs_object_id", "hs_discount_percentage"],
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
