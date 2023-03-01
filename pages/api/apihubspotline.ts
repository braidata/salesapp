import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

type Response = {
  success: boolean;
  data?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  try {
    const id = req.body.id;
    const url = `https://api.hubapi.com/crm/v4/objects/deals/${id}/associations/line_items/`;
    const response = await axios({
      method: "GET",
      url: url,
      headers: {
        Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`,
      },
    });

    res.status(200).json({ success: true, data: response.data.results });
  } catch (error) {
    console.log("Inténtalo de nuevo", error);
    return res.status(500).json({ success: false });
  }
}



