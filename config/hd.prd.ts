export const hdPrdConfig = {
  name: "prd",
  baseURL: process.env.HD_PRD_BASE_URL || "https://api.homedeliverype.com",
  token: process.env.HD_PRD_TOKEN || "",
  direccionOrigenId: Number(process.env.HD_PRD_DIRECCION_ORIGEN_ID || "0"),
};
