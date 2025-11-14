export const hdQaConfig = {
  name: "qa",
  baseURL: process.env.HD_QA_BASE_URL || "https://api.homedeliverype.com",
  token: process.env.HD_QA_TOKEN || "",
  direccionOrigenId: Number(process.env.HD_QA_DIRECCION_ORIGEN_ID || "0"),
};
