// pages/api/hd/orchestrator_vtex.ts
// VTEX (HANDLING) -> Falabella Home Delivery Perú
//
// Usa:
//  - lib/vtex.ts          → listOrders / getOrderById / createOrderNote
//  - lib/hdClient.ts      → createHdAxios (qa/prd)
// Mapping VTEX → HD inline.

import type { NextApiRequest, NextApiResponse } from "next";
import { listOrders, getOrderById, type VtexStore, createOrderNote } from "../../../lib/vtex";
import { createHdAxios } from "../../../lib/hdClient";

// ==== Tipos mínimos para HD (internos) ====

type HdDetalleItem = {
    alto: string;
    ancho: string;
    largo: string;
    peso: string;
    talla: string;
    unidad: number;
    skuDesc: string;
    valorRecaudo: string;
    codigoProducto: string;
    valorDeclarado: string;
    pesoVolumetrico: string;
};

type HdCreateOrderPayload = {
    direccion_origen_id: number;
    direccion_envio: {
        direccion_destinatario: string;
        ubigeo_destinatario: string;
        latitud_destinatario: number | null;
        longitud_destinatario: number | null;
        referencia_destinatario: string;
        comentario: string;
    };
    cliente: {
        nombre_destinatario: string;
        ruc_dni_destinatario: string;
        telefono_destinatario: string;
        email_destinatario: string;
    };
    pedido: {
        orden_compra: string;
        lpn: string;
        promesa_despacho: string;
        promesa_entrega: string;
        valor_declarado: string;
        canal_venta: string;
        detalle: HdDetalleItem[];
    };
};

interface VtexOrderSummary {
    orderId: string;
    status: string;
    [key: string]: any;
}

// ==== Helpers genéricos ====

// Máx unidades que metés en un mismo bulto del mismo SKU.
// Ajustá esto según cómo embalan físicamente.
const MAX_UNITS_PER_BULTO = 3;

// Tabla simplificada basada en el PDF (Tabla 3: Package sizes)
type HdSizeCode =
    | "XS3"
    | "XS2"
    | "XS"
    | "S"
    | "LO"
    | "M"
    | "L"
    | "XL"
    | "XXL"
    | "O"
    | "EO";

interface HdSizeBand {
    code: HdSizeCode;
    minKg: number;
    maxKg: number;
}

const HD_SIZE_BANDS: HdSizeBand[] = [
    { code: "XS3", minKg: 0, maxKg: 0.5 },
    { code: "XS2", minKg: 0.5, maxKg: 1 },
    { code: "XS", minKg: 1, maxKg: 3 },
    { code: "S", minKg: 3, maxKg: 10 },
    // LO (Light Oversized) lo manejamos aparte por dimensiones
    { code: "M", minKg: 10, maxKg: 20 },
    { code: "L", minKg: 20, maxKg: 30 },
    { code: "XL", minKg: 30, maxKg: 50 },
    { code: "XXL", minKg: 50, maxKg: 100 },
    { code: "O", minKg: 100, maxKg: 300 },
    { code: "EO", minKg: 300, maxKg: 1000 },
];

// Helper para sanitizar LPN (sacar guiones)
function sanitizeLpn(raw: unknown): string {
    if (raw == null) return "";
    // Deja solo letras y números, vuela guiones y cualquier otro símbolo.
    return String(raw).replace(/[^A-Za-z0-9]/g, "");
}

function clip(s: any, max = 80): string {
    if (s == null) return "";
    const str = String(s).trim();
    return str.length > max ? str.slice(0, max) : str;
}

function toInt(x: any, def = 0): number {
    const n = Number(x);
    return Number.isFinite(n) ? Math.trunc(n) : def;
}

function gramsToKg(grams: any): number {
    const g = Number(grams);
    if (!Number.isFinite(g) || g <= 0) return 0;
    return g / 1000;
}

function safeDate(d: any): Date {
    const dt = d ? new Date(d) : new Date();
    return isNaN(dt.getTime()) ? new Date() : dt;
}

function addDays(base: Date, days: number): string {
    const d = new Date(base.getTime());
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function getItemDimensions(item: any) {
    const dim = item?.additionalInfo?.dimension || {};

    let alto = toInt(dim.height, 10);
    let ancho = toInt(dim.width, 10);
    let largo = toInt(dim.length, 10);

    if (!alto && !ancho && !largo) {
        // fallback mínimo para no mandar 0 a HD
        alto = 10;
        ancho = 10;
        largo = 10;
    }

    return {
        alto,
        ancho,
        largo,
        weightGr: toInt(dim.weight, 1000),
    };
}

// Peso volumétrico aproximado en kg (ajustá divisor si HD usa otro)
function computeVolumetricKg(altoCm: number, anchoCm: number, largoCm: number): number {
    if (!altoCm || !anchoCm || !largoCm) return 0;
    const volumeCm3 = altoCm * anchoCm * largoCm;
    const divisor = 5000; // típico; si HD usa 4000/6000 se cambia acá
    return volumeCm3 / divisor;
}

// Determina talla a partir del peso cobrado y dimensiones, usando la tabla del PDF.
function computeHdTalla(
    billedKg: number,
    altoCm: number,
    anchoCm: number,
    largoCm: number
): string {
    const maxSide = Math.max(altoCm, anchoCm, largoCm);

    // Light Oversized: lado largo pero peso relativamente bajo
    if (maxSide >= 650 && billedKg <= 20) {
        return "LO";
    }

    const band = HD_SIZE_BANDS.find(
        (b) => billedKg >= b.minKg && billedKg <= b.maxKg
    );

    return band?.code ?? "O";
}

// Divide una cantidad total en varios bultos, cada uno con hasta MAX_UNITS_PER_BULTO unidades.
function splitQuantityIntoBultos(totalUnits: number, maxPerBulto: number): number[] {
    const result: number[] = [];
    let remaining = totalUnits;

    while (remaining > 0) {
        const chunk = Math.min(remaining, maxPerBulto);
        result.push(chunk);
        remaining -= chunk;
    }

    return result;
}

function logHdOrderPayloadDebug(
    orderId: string,
    store: string,
    envName: string,
    payload: HdCreateOrderPayload
) {
    console.log(
        `[HD-ORCHESTRATOR-VTEX] Payload HD generado para orderId=${orderId} store=${store} env=${envName}`
    );

    try {
        console.log(
            "[HD-ORCHESTRATOR-VTEX] JSON payload HD:",
            JSON.stringify(payload, null, 2)
        );
    } catch (e) {
        console.warn(
            "[HD-ORCHESTRATOR-VTEX] No se pudo stringify el payload, se loguea objeto crudo."
        );
        console.log(payload);
    }
}


// ==== Mapping VTEX → HD (detalle con multi-bulto) ====

function mapItemsToHdDetalle(vtexOrder: any): HdDetalleItem[] {
    const items = Array.isArray(vtexOrder?.items) ? vtexOrder.items : [];
    const detalle: HdDetalleItem[] = [];

    for (const item of items) {
        const quantity = toInt(item?.quantity, 0);
        if (quantity <= 0) continue;

        const dims = getItemDimensions(item);

        // Peso real y volumétrico POR UNIDAD
        const pesoUnitKg = gramsToKg(dims.weightGr);
        const pesoUnitKgSafe = pesoUnitKg > 0 ? pesoUnitKg : 0.5;

        const volumetricUnitKg = computeVolumetricKg(
            dims.alto,
            dims.ancho,
            dims.largo
        );
        const volumetricUnitKgSafe =
            volumetricUnitKg > 0 ? volumetricUnitKg : pesoUnitKgSafe;

        // Peso cobrado POR bulto (no por toda la línea)
        const billedUnitKg = Math.max(
            pesoUnitKgSafe,
            volumetricUnitKgSafe,
            0.5
        );

        const talla = computeHdTalla(
            billedUnitKg,
            dims.alto,
            dims.ancho,
            dims.largo
        );

        const skuRef =
            item?.refId ||
            item?.RefId ||
            item?.sellerSku ||
            item?.id ||
            item?.productId ||
            "SKU-SIN-REF";

        const desc =
            item?.name ||
            item?.productName ||
            `Producto ${skuRef}`;

        // Valor UNITARIO (HD espera por-bulto, no por línea)
        const unitValueRaw = Number(item?.sellingPrice ?? item?.price ?? 0);
        const unitValue = unitValueRaw > 0 ? unitValueRaw / 100 : 0;

        detalle.push({
            alto: String(Math.max(1, dims.alto)),            // cm
            ancho: String(Math.max(1, dims.ancho)),
            largo: String(Math.max(1, dims.largo)),
            peso: billedUnitKg.toFixed(2),                  // kg POR bulto
            talla,
            unidad: quantity,                               // 🔥 cantidad de ese SKU
            skuDesc: clip(desc, 80),
            valorRecaudo: "0",
            codigoProducto: String(skuRef),
            valorDeclarado: unitValue.toFixed(2),           // valor UNITARIO
            pesoVolumetrico: volumetricUnitKgSafe.toFixed(2) // volumétrico POR bulto
        });
    }

    return detalle;
}



function mapVtexOrderToHdPayload(
    vtexOrder: any,
    direccionOrigenId: number,
    canalVentaOverride?: string
): HdCreateOrderPayload {
    const orderId: string =
        vtexOrder?.orderId || vtexOrder?.orderGroup || "SIN_OC";

    const shipping = vtexOrder?.shippingData || {};
    const address = shipping?.address || {};
    const client = vtexOrder?.clientProfileData || {};

    const street = address?.street || "";
    const number = address?.number || "";
    const neighborhood = address?.neighborhood || "";
    const city = address?.city || "";
    const postalCode = address?.postalCode || "";
    const complement = address?.complement || "";
    const reference = address?.reference || "";

    const destinatarioNombre = clip(
        `${client.firstName || ""} ${client.lastName || ""}`.trim(),
        80
    );
    const destinatarioDoc = clip(client.document || "", 20);
    const destinatarioFono = clip(client.phone || "", 30);
    const destinatarioEmail = clip(client.email || "", 80);

    const li0 = Array.isArray(shipping?.logisticsInfo)
        ? shipping.logisticsInfo[0]
        : null;
    const slaName = li0?.selectedSla || li0?.slas?.[0]?.name || "";
    const courierName =
        li0?.deliveryCompany ||
        li0?.slas?.[0]?.deliveryIds?.[0]?.courierName ||
        "";

    const comentario = clip(
        [
            slaName && `SLA: ${slaName}`,
            courierName && `Courier: ${courierName}`,
            reference || complement,
        ]
            .filter(Boolean)
            .join(" | "),
        180
    );

    const direccion_destinatario = clip(
        [
            [street, number].filter(Boolean).join(" "),
            neighborhood || city,
        ]
            .filter(Boolean)
            .join(", "),
        120
    );

    const ubigeo_destinatario = postalCode || "";

    const creationDate = safeDate(vtexOrder?.creationDate);
    const promesa_despacho = addDays(creationDate, 1);
    const promesa_entrega = addDays(creationDate, 5);

    const rawOrderValue = Number(vtexOrder?.value ?? 0);
    const valorTotal = rawOrderValue > 0 ? rawOrderValue / 100 : 0;
    const valor_declarado = valorTotal.toFixed(2);

    const detalle = mapItemsToHdDetalle(vtexOrder);

    const canal_venta =
        canalVentaOverride ||
        `VTEX - FALABELLA HOME DELIVERY`;

    const lpn =
        vtexOrder?.orderId ||
        vtexOrder?.sellerOrderId ||
        orderId;

    const payload: HdCreateOrderPayload = {
        direccion_origen_id: direccionOrigenId,
        direccion_envio: {
            direccion_destinatario,
            ubigeo_destinatario,
            latitud_destinatario: null,
            longitud_destinatario: null,
            referencia_destinatario: complement || reference || "",
            comentario,
        },
        cliente: {
            nombre_destinatario: destinatarioNombre || "Cliente VENTUS PERU",
            ruc_dni_destinatario: destinatarioDoc || "00000000",
            telefono_destinatario: destinatarioFono || "000000000",
            email_destinatario: destinatarioEmail || "no-reply@ventus.pe",
        },
        pedido: {
            orden_compra: orderId,
            lpn: sanitizeLpn(lpn),
            promesa_despacho,
            promesa_entrega,
            valor_declarado,
            canal_venta,
            detalle,
        },
    };

    return payload;
}

// ==== Helper para leer respuesta de HD (soporta ok/error/details) ====

function extractHdData(data: any): { success: boolean; message: string | null } {
    if (!data || typeof data !== "object") {
        return { success: false, message: "Respuesta HD inválida" };
    }

    // Caso Home Delivery proxy: { ok: false, env, error, details: { success, message } }
    if (data.ok === false && data.details) {
        const success = Boolean(data.details.success ?? false);
        const message =
            data.error ||
            data.details.message ||
            data.message ||
            null;
        return { success, message };
    }

    // Caso estándar { success, message } o variantes
    const success = Boolean(
        (data as any).success ??
        (data as any).Success ??
        false
    );

    const message =
        (data as any).message ??
        (data as any).Message ??
        (data as any).detail ??
        null;

    return { success, message };
}

// ==== Handler principal ====

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ error: "Método no permitido" });
    }

    const envParam = (req.query.env as string) || undefined;
    const pageStart = Number(req.query.page ?? 1) || 1;
    const perPage = Number(req.query.perPage ?? 10) || 100;
    const maxPages = Number(req.query.maxPages ?? 1) || 1;
    const storeParam = (req.query.store as VtexStore) || "ventusperu";
    const status = (req.query.status as string) || "ready-for-handling";

    console.log(
        `[HD-ORCHESTRATOR-VTEX] Start env=${envParam || "auto"} store=${storeParam} status=${status} pageStart=${pageStart} perPage=${perPage} maxPages=${maxPages}`
    );

    try {
        const { client, config } = createHdAxios(envParam);

        const results: any[] = [];
        const errors: any[] = [];
        let pagesProcessed = 0;

        // Loop de paginación simple
        for (let currentPage = pageStart; currentPage < pageStart + maxPages; currentPage++) {
            const queryString = [
                `page=${currentPage}`,
                `per_page=${perPage}`,
                `orderBy=creationDate,desc`,
                `f_status=${encodeURIComponent(status)}`,
            ].join("&");

            const vtexListResp = await listOrders(queryString, storeParam);

            const list: VtexOrderSummary[] = Array.isArray(vtexListResp?.list)
                ? vtexListResp.list
                : Array.isArray(vtexListResp)
                    ? vtexListResp
                    : [];

            console.log(
                `[HD-ORCHESTRATOR-VTEX] VTEX [${storeParam}] page=${currentPage} órdenes ${status} encontradas: ${list.length}`
            );

            if (!list.length) {
                // Nada más que procesar
                break;
            }

            pagesProcessed++;

            for (const summary of list) {
                const orderId = summary.orderId;
                console.log(
                    `[HD-ORCHESTRATOR-VTEX] Procesando VTEX orderId=${orderId} (store=${storeParam}, page=${currentPage})`
                );

                let lpnForNote = orderId;

                try {
                    const vtexOrder = await getOrderById(orderId, "VENTUSPERU_VTEX");

                    const payload = mapVtexOrderToHdPayload(
                        vtexOrder,
                        config.direccionOrigenId,
                        "VTEX - FALABELLA HOME DELIVERY"
                    );

                    const lpn =
                        payload?.pedido?.lpn ||
                        payload?.pedido?.orden_compra ||
                        vtexOrder?.orderId ||
                        orderId;

                    lpnForNote = lpn;

                    logHdOrderPayloadDebug(orderId, storeParam, config.name, payload);

                    const hdResp = await client.post(
                        "/api/v2/pedido/nuevo-pedido/",
                        payload
                    );

                    const { success, message } = extractHdData(hdResp.data);

                    if (!success) {
                        throw new Error(
                            `HomeDelivery devolvió error lógico. Mensaje: ${message || "Sin detalle"}`
                        );
                    }

                    console.log(
                        `[HD-ORCHESTRATOR-VTEX] HD OK para VTEX ${orderId} (LPN: ${lpn})`
                    );

                    results.push({
                        orderId,
                        store: storeParam,
                        env: config.name,
                        lpn,
                        success: true,
                        message: message || "Registro exitoso",
                        hdRaw: hdResp.data,
                    });

                    // Nota en VTEX (éxito)
                    try {
                        const noteText = `Integrado a HD por Braidata. Resultado: OK. Mensaje: ${message || "Registro exitoso"}. LPN: ${lpn}. Entorno: ${config.name}.`;
                        await createOrderNote(storeParam, orderId, noteText);
                    } catch (noteErr: any) {
                        console.error(
                            `[HD-ORCHESTRATOR-VTEX] Error agregando nota VTEX (OK) ${orderId}:`,
                            noteErr?.message
                        );
                    }
                } catch (err: any) {
                    // Extraer detalle real de HD si viene en response.data
                    let hdStatus: number | null = null;
                    let hdData: any = null;
                    let hdMsg: string | null = null;

                    if (err?.response) {
                        hdStatus = err.response.status ?? null;
                        hdData = err.response.data;
                        const extracted = extractHdData(hdData);
                        hdMsg = extracted.message || null;
                    }

                    const finalErrorMsg =
                        hdMsg ||
                        err?.message ||
                        "Error desconocido";

                    // 🆕 Caso especial: LPN ya existe → lo tratamos como éxito idempotente
                    const alreadyIntegrated =
                        typeof hdMsg === "string" &&
                        /lpn\s+ya\s+existe/i.test(hdMsg);

                    if (alreadyIntegrated) {
                        const msg =
                            hdMsg ||
                            "LPN ya existe en Home Delivery. Se asume pedido previamente integrado.";

                        console.warn(
                            `[HD-ORCHESTRATOR-VTEX] LPN duplicado para ${summary.orderId} [${storeParam}]. Se asume ya integrado. Mensaje HD: ${msg}`
                        );

                        // Lo contamos como éxito, NO como error
                        results.push({
                            orderId,
                            store: storeParam,
                            env: config.name,
                            lpn: lpnForNote,
                            success: true,
                            message: msg,
                            hdRaw: hdData || err.response?.data || null,
                            alreadyIntegrated: true,
                        });

                        // Opcional: si no querés ensuciar notas, no escribimos nada en VTEX
                        // Si quisieras dejarlo explícito pero suave:
                        /*
                        try {
                          const noteText = `HD ya tenía registrado este LPN. Se asume pedido integrado previamente. Mensaje HD: ${msg}. Entorno: ${config.name}.`;
                          await createOrderNote(storeParam, orderId, noteText);
                        } catch (noteErr: any) {
                          console.error(
                            `[HD-ORCHESTRATOR-VTEX] Error agregando nota VTEX (ALREADY-INTEGRATED) ${orderId}:`,
                            noteErr?.message
                          );
                        }
                        */

                        // Importantísimo: salimos del catch SIN meterlo a "errors"
                        continue;
                    }

                    // 🔻 Resto de errores reales (sí se consideran FALLÓ)
                    console.error(
                        `[HD-ORCHESTRATOR-VTEX] Error procesando ${summary.orderId} [${storeParam}]:`,
                        finalErrorMsg
                    );

                    errors.push({
                        orderId,
                        store: storeParam,
                        error: finalErrorMsg,
                        success: false,
                        hdStatus,
                        hdBody: hdData || undefined,
                        lpn: lpnForNote,
                    });

                    // Nota en VTEX (error) – NO cambias status en VTEX, solo timeline
                    try {
                        const noteText = `Integración HD por Braidata FALLÓ. Error: ${finalErrorMsg}. LPN: ${lpnForNote}. Entorno: ${config.name}.`;
                        await createOrderNote(storeParam, orderId, noteText);
                    } catch (noteErr: any) {
                        console.error(
                            `[HD-ORCHESTRATOR-VTEX] Error agregando nota VTEX (ERROR) ${orderId}:`,
                            noteErr?.message
                        );
                    }
                }

                // Throttle para no saturar HD
                await new Promise((r) => setTimeout(r, 900));
            }
        }

        const summary = {
            message: "Orquestador VTEX → Falabella Home Delivery ejecutado",
            env: config.name,
            store: storeParam,
            status,
            pageStart,
            perPage,
            maxPages,
            pagesProcessed,
            processed: results.length + errors.length,
            successful: results.length,
            failed: errors.length,
            results,
            errors: errors.length ? errors : undefined,
        };

        console.log(
            `[HD-ORCHESTRATOR-VTEX] Finalizado. Exitosos: ${results.length}, Errores: ${errors.length}`
        );

        return res.status(200).json(summary);
    } catch (e: any) {
        console.error("[HD-ORCHESTRATOR-VTEX] Error crítico:", e);
        return res.status(500).json({
            error: e?.message || "Error procesando orquestador VTEX → Home Delivery",
            details: process.env.NODE_ENV === "development" ? e.stack : undefined,
        });
    }
}
