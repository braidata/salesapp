// 📌 Archivo: pages/api/reverse-geocode.ts
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "Faltan parámetros latitud y longitud" });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
    );
    const data = await response.json();

    if (!data.address) {
      return res.status(404).json({ error: "Ubicación no encontrada" });
    }

    // Extraer la comuna o localidad
    const { town, city, municipality, county, state } = data.address;

    res.status(200).json({
      localidad: town || city || municipality || county || state || "Desconocido",
      detalles: data.address,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la ubicación", details: error });
  }
}
