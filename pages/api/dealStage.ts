import type { NextApiRequest, NextApiResponse } from "next";

import axios from "axios";
import { useState } from "react";
type Response = {
  success: boolean;
  data?: string;
};
 


export default async (req: NextApiRequest, res: NextApiResponse<Response>) => {
  //console.log(req.body.first)
  //const first = req.body.first
  //console.log(req.body.id)
  //const last = req.body.last
  
  try {
    let id = req.body.id
    const url = `https://api.hubapi.com/crm/v3/objects/deals/${id}/?hapikey=${process.env.APP_KEY}`
    const response = await axios({
      method: "PATCH",
      url: url,
      data: {
        "properties":  {"dealstage": "closedwon"},

        
    
       }
      
    });
    //console.log(id)
    res.status(200).json({ success: true, data: response.data.results });
    //console.log("Esta es la data",response.data.results)
  } catch (error) {
    console.log("Intenta de nuevo con el negocio " + error)
    return res.status(500).json({ success: false });
  }
};