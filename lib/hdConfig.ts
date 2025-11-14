import { hdQaConfig } from "../config/hd.qa";
import { hdPrdConfig } from "../config/hd.prd";

export type HdEnv = "qa" | "prd";

export interface HdConfig {
  name: HdEnv;
  baseURL: string;
  token: string;
  direccionOrigenId: number;
}

const configs: Record<HdEnv, HdConfig> = {
  qa: hdQaConfig,
  prd: hdPrdConfig,
};

export function resolveHdEnv(env?: string | null): HdEnv {
  const fromParam = env === "prd" ? "prd" : env === "qa" ? "qa" : null;
  if (fromParam) return fromParam;

  const fromProcess = (process.env.HD_ENV as HdEnv | undefined) || "qa";
  return fromProcess === "prd" ? "prd" : "qa";
}

export function getHdConfig(env?: string | null): HdConfig {
  const e = resolveHdEnv(env);
  const cfg = configs[e];

  if (!cfg.token) {
    console.warn(`[HomeDelivery] Falta token para entorno '${e}'. Revisa tus variables de entorno.`);
  }

  return cfg;
}
