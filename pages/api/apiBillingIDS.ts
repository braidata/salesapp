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
    const id = req.body.id;
    const url = `https://api.hubapi.com/crm/v4/objects/contacts/${id}/associations/companies/`;
    const token = process.env.HUBSPOT_TOKEN; // Reemplaza con el token válido

    const response = await axios({
      method: "GET",
      url: url,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    res.status(200).json({ success: true, data: response.data.results });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
}