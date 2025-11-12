// pages/api/reverse-geocode.ts
import type { NextApiRequest, NextApiResponse } from "next";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

type NominatimAddress = Partial<{
  house_number: string;
  road: string;
  neighbourhood: string;
  suburb: string;
  city_district: string;
  town: string;
  city: string;
  municipality: string;
  village: string;
  county: string;        // p.ej. Provincia de Santiago
  state: string;         // p.ej. Región Metropolitana
  postcode: string;
  country: string;
  country_code: string;
}>;

type NominatimResponse = {
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: NominatimAddress;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" });

  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return res.status(400).json({ error: "Parámetros lat/lon inválidos" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const params = new URLSearchParams({
      format: "jsonv2",
      lat: String(lat),
      lon: String(lon),
      addressdetails: "1",
      namedetails: "0",
      "accept-language": "es",
    });

    const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      signal: controller.signal,
      headers: {
        "User-Agent": "VentusCorp-Geocoder/1.0 (contacto@tu-dominio.cl)",
        "Accept-Language": "es",
        Referer: "https://tu-dominio.cl",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Fallo Nominatim", status: response.status });
    }

    const data: NominatimResponse = await response.json();
    const addr = data.address;
    if (!addr) return res.status(404).json({ error: "Ubicación no encontrada" });

    // Prioridad típica para CL (comuna/barrio → ciudad → provincia → región)
    const localidad =
      addr.neighbourhood ||
      addr.suburb ||
      addr.city_district ||
      addr.city ||
      addr.town ||
      addr.municipality ||
      addr.village ||
      addr.county ||   // Provincia de Santiago
      addr.state ||    // Región
      "Desconocido";

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json({
      localidad,
      detalles: addr,
      display_name: data.display_name,
      coords: { lat, lon },
    });
  } catch (err: any) {
    const aborted = err?.name === "AbortError";
    return res.status(aborted ? 504 : 500).json({
      error: aborted ? "Timeout de geocodificación" : "Error al obtener la ubicación",
    });
  } finally {
    clearTimeout(timeout);
  }
}
