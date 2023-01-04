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
    const url = `https://api.hubapi.com/crm/v3/objects/deal/search/?hapikey=${process.env.APP_KEY}`
    const response = await axios({
      method: "POST",
      url: url,
      data: {
        "properties": [ "dealname","hubspot_owner_id","dealstage","hs_object_id", "amount", "flete", "fecha_despacho_retiro", "nombre_retira", "rut_de_retiro", "tipo_de_despacho", "rut_de_retiro", "observacion", "cantidad_de_pagos", "codigos_de_autorizacion", "fecha_de_validacion_de_pagos", "metodo_pago" ],

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
    //console.log("Esta es la data",response.data.results)
  } catch (error) {
    console.log("Intenta de nuevo con el negocio " + error)
    return res.status(500).json({ success: false });
  }
};