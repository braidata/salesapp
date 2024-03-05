import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

type Response = {
  success: boolean;
  data?: any; // Permite devolver una estructura de datos compleja.
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  try {
    const id = req.body.id || req.query.id;
    const token = process.env.HUBSPOT_TOKEN;
    let allResults: any[] = [];
    let after = null; // Iniciar sin cursor de paginación
    const limit = 10; // Límite de objetos por solicitud
    
    // Bucle para manejar la paginación automáticamente
    do {
      let url = `https://api.hubapi.com/crm/v4/objects/contacts/${id}/associations/deals/?limit=${limit}`;
      if (after) {
        url += `&after=${after}`;
      }

      const response = await axios({
        method: "GET",
        url: url,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Añadir resultados de esta página a la lista total
      allResults = allResults.concat(response.data.results).reverse().slice(0, 5);
      console.log("DEALMOTHER", allResults)

      // Actualizar el cursor para la próxima página, si existe
      after = response.data.paging ? response.data.paging.next.after : null;
    } while (after); // Continuar mientras haya una página siguiente

    res.status(200).json({ success: true, data: allResults });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
}