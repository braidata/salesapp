import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";


type Response = {
  success: boolean;
  data?: string;
};


export default async (req: NextApiRequest, res: NextApiResponse<Response>) => {
  console.log(req.body.id)
  const id = req.body.id // ? req.body.id : "5368707"
  try {
    const url = `https://api.hubapi.com/crm/v4/objects/contacts/${id}/associations/companies/?hapikey=${process.env.APP_KEY}`
    const response = await axios({
      method: "GET",
      url: url,
      
    });
    console.log(id)
    res.status(200).json({ success: true, data: response.data.results });
    //console.log(response.data.results)
  } catch (error) {
    return res.status(500).json({ success: false });
  }
};