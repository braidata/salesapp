import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res
      .status(405)
      .end(`Method ${req.method} Not Allowed`);
  }

  const {
    startDate,
    endDate,
    page = "1",
    perPage = "10",
  } = req.query as {
    startDate?: string;
    endDate?: string;
    page?: string;
    perPage?: string;
  };

  if (!startDate || !endDate) {
    return res.status(400).json({
      message:
        "Se requieren los parámetros startDate y endDate",
    });
  }

  // ✅ CORRECCIÓN: Usar URLSearchParams para manejar encoding automáticamente
  const baseUrl = "https://imegab2c.myvtex.com/api/oms/pvt/orders";
  const params = new URLSearchParams({
    orderBy: "creationDate,desc",
    f_creationDate: `creationDate:[${startDate}T00:00:00.000Z TO ${endDate}T23:59:59.999Z]`,
    page: page,
    per_page: perPage
  });

  const VTEX_API_URL = `${baseUrl}?${params.toString()}`;

  if (
    !process.env.API_VTEX_KEY ||
    !process.env.API_VTEX_TOKEN
  ) {
    return res.status(500).json({
      message:
        "Faltan credenciales de VTEX en las variables de entorno",
    });
  }

  try {
    console.log("📨 Received params:", { startDate, endDate, page, perPage });
    console.log("🔗 VTEX URL →", VTEX_API_URL);
    
    const response = await fetch(VTEX_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VTEX-API-AppKey": process.env.API_VTEX_KEY!,
        "X-VTEX-API-AppToken": process.env.API_VTEX_TOKEN!,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ VTEX API Error:", response.status, errorText);
      throw new Error(
        `Error en la API de VTEX: ${response.status} – ${errorText}`
      );
    }

    const data = await response.json();
    console.log("✅ VTEX Response:", {
      hasData: !!data,
      hasList: !!data.list,
      listLength: data.list?.length || 0,
      totalCount: data.totalCount || 0
    });
    
    // ✅ CORRECCIÓN: Devolver solo la lista de orders, no todo el objeto
    return res.status(200).json(data.list || []);
    
  } catch (error) {
    console.error("❌ Error al obtener las órdenes de VTEX:", error);
    return res.status(500).json({
      message: "Error al obtener las órdenes de VTEX",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}