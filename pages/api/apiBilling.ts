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
    const id = req.body.id //? req.body.id : "3963440582"
    const url = `https://api.hubapi.com/crm/v3/objects/company/search/?hapikey=${process.env.APP_KEY}`
    const response = await axios({
      method: "POST",
      url: url,
      data: {
        "properties": [ "razon_social", "giro_empresa", "rut_de_empresa", "name","phone","city","zip", "comuna","state","calle","casa_depto","numero_direccion", "hubspot_owner_id","hubspot_owner_assigneddate","mobilephone", ],

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