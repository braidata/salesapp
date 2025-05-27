import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { categoryId, brandId, from = "0", to = "49" } = req.query;

  // 1) Dominio VTEX correcto
  const account = process.env.VTEX_ACCOUNT; // p.ej. "imegab2c"
  const domain = `${account}.vtexcommercestable.com.br`;
  const basePath = "/api/catalog_system/pub/products/search"; // o "/.../pub/products/search" si no necesitás clave

  // 2) Construyo URL con URLSearchParams para evitar errores de encoding
  const url = new URL(basePath, `https://${domain}`);
  url.searchParams.set("_from", String(from));
  url.searchParams.set("_to", String(to));

  if (categoryId) {
    url.searchParams.append("fq", `C:${categoryId}`);
  }
  if (brandId) {
    url.searchParams.append("fq", `B:${brandId}`);
  }

  // 3) Credenciales sólo si es endpoint private
  if (!process.env.API_VTEX_KEY || !process.env.API_VTEX_TOKEN) {
    return res.status(500).json({ message: "Faltan credenciales de VTEX en las variables de entorno" });
  }

  try {
    console.log("VTEX URL →", url.toString());  // DEBUG: inspeccioná la URL final
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VTEX-API-AppKey": process.env.API_VTEX_KEY!,
        "X-VTEX-API-AppToken": process.env.API_VTEX_TOKEN!,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en la API de VTEX: ${response.status} – ${errorText}`);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error("Error al obtener los productos de VTEX:", error);
    return res.status(500).json({ message: "Error al obtener los productos de VTEX" });
  }
}
