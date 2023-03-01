import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

type Response = {
  success: boolean;
  data?: string;
};

export default async (req: NextApiRequest, res: NextApiResponse<Response>) => {
  try {
    const id = req.body.id;
    const url = `https://api.hubapi.com/crm/v3/objects/deals/${id}`;
    const response = await axios({
      method: "PATCH",
      url: url,
      headers: {
        Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`,
      },
      data: {
        properties: {
          dealstage: "closedwon",
        },
      },
    });

    res.status(200).json({ success: true, data: response.data.results });
  } catch (error) {
    console.log("Intenta de nuevo con el negocio " + error);
    return res.status(500).json({ success: false });
  }
};