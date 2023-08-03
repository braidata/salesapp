import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

type Response = {
  success: boolean;
  data?: string;
};

export default async (req: NextApiRequest, res: NextApiResponse<Response>) => {
  try {
    const id = req.body.id ? req.body.id : req.query.id;
    const url = `https://api.hubapi.com/crm/v3/objects/deal/search/`;
    const response = await axios({
      method: "POST",
      url: url,
      headers: {
        Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`,
      },
      data: {
        properties: [
          "dealname",
          "rut_pagador",
          "orden_de_compra",
          "hubspot_owner_id",
          "dealstage",
          "hs_object_id",
          "amount",
          "numero_envio",
          "region_envio",
          "comuna_envio",
          "codigo_postal_de_envio",
          "ciudad_envio",
          "casa_o_depto_de_envio",
          "calle_envio",
          "flete",
          "fecha_despacho_retiro",
          "nombre_retira",
          "rut_de_retiro",
          "tipo_de_despacho",
          "rut_de_retiro",
          "observacion",
          "cantidad_de_pagos",
          "codigos_de_autorizacion",
          "fecha_de_validacion_de_pagos",
          "metodo_pago",
          "metodo_de_pago",
          "tipo_pago_sap",
          "clase",
          "canal",
          "almacen",
          "centro",
        ],
        filterGroups: [
          {
            filters: [
              {
                propertyName: "hs_object_id",
                operator: "EQ",
                value: id,
              },
            ],
          },
        ],
        sorts: [
          {
            propertyName: "createdate",
            direction: "DESCENDING",
          },
        ],
      },
    });
    console.log("DEALAZO: ", response.data.results);
    res.status(200).json({ success: true, data: response.data.results });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
};