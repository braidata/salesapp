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
    const id = req.body.id
    const url = `https://api.hubapi.com/crm/v3/objects/line_item/search/?hapikey=${process.env.APP_KEY}`
    const response = await axios({
      method: "POST",
      url: url,
      data: {
        "properties": [ "name","amount","quantity", "hs_sku", "hs_object_id" ],

        "filterGroups": [
            { "filters": [
              { "propertyName": "hs_object_id" , "operator": "EQ", "value": id }
              // ,
              //   // { "propertyName": "firstname", "operator": "EQ", "value": first },
              //   { "propertyName": "lastname", "operator": "EQ", "value": last }
                
            ]
          
          }
        ],
    
        "sorts": [
            {
              "propertyName": "createdate",
              "direction": "DESCENDING"
            }
          ]}
      
    });
    //console.log(id)
    res.status(200).json({ success: true, data: response.data.results });
    //console.log(response.data.results)
  } catch (error) {
    return res.status(500).json({ success: false });
  }
};