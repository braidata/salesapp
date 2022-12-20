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
  console.log(req.body.email)
  //const last = req.body.last
  const email = req.body.email
  try {
    const url = `https://api.hubapi.com/crm/v3/objects/deals/search/?hapikey=${process.env.APP_KEY}`
    const response = await axios({
      method: "POST",
      url: url,
      data: {
        "properties": [ "firstname", "lastname", "email", "state", "rut", "hubspot_owner_id" ],

        "filterGroups": [
            { "filters": [
              { "propertyName": "email" , "operator": "EQ", "value": email }
              // ,
              //   // { "propertyName": "firstname", "operator": "EQ", "value": first },
              //   { "propertyName": "lastname", "operator": "EQ", "value": last }
                
            ]
          
          }
        ] }
      
    });
    //console.log(id)
    res.status(200).json({ success: true, data: response.data.results });
    //console.log(response.data.results)
  } catch (error) {
    return res.status(500).json({ success: false });
  }
};