import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

type Response = {
  success: boolean;
  data?: any;
};

export default async (req: NextApiRequest, res: NextApiResponse<Response>) => {
  const ownerID = req.body.id ? req.body.id : req.query.id;
  try {
    const url = `https://api.hubapi.com/owners/v2/owners/${ownerID}`;
    const token = process.env.HUBSPOT_TOKEN;
    const response = await axios({
      method: "GET",
      url: url,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    res.status(200).json({
      success: true,
      data: [response.data.email, response.data.firstName, response.data.lastName, response.data.ownerId],
    });
  } catch (error) {
    console.log("Intenta de nuevo con el dueño " + error);
    return res.status(500).json({ success: false });
  }
};


