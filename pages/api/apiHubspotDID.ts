import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";


type Response = {
  success: boolean;
  data?: string;
};


export default async (req: NextApiRequest, res: NextApiResponse<Response>) => {
  //console.log(req.body.id)

  try {
    const id = req.body.id
    const url = `https://api.hubapi.com/crm/v4/objects/deals/${id}/associations/line_items/?hapikey=${process.env.APP_KEY}`
    const response = await axios({
      method: "GET",
      url: url,
      
    });
    //console.log(id)
    res.status(200).json({ success: true, data: response.data.results });
    //console.log(response.data.results)
  } catch (error) {
    return res.status(500).json({ success: false });
  }
};