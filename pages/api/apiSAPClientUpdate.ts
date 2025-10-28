// pages/api/apiSAPClientUpdate.ts
import { PrismaClient, sap_client } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

interface ApiResponse {
  success?: boolean;
  message?: string;
  client?: any;
  error?: string;
  details?: any;
  status?: number;
}

type UpdatableKey =
  | 'client_rut'
  | 'client_nombre'
  | 'client_apellido_paterno'
  | 'client_apellido_materno'
  | 'client_sexo'
  | 'client_celular'
  | 'client_telefono'
  | 'client_email'
  | 'client_calle'
  | 'client_numero_calle'
  | 'client_numero_casa_depto'
  | 'client_region'
  | 'client_ciudad'
  | 'client_comuna'
  | 'client_giro'
  | 'updated_by';

const UPDATABLE_KEYS: UpdatableKey[] = [
  'client_rut',
  'client_nombre',
  'client_apellido_paterno',
  'client_apellido_materno',
  'client_sexo',
  'client_celular',
  'client_telefono',
  'client_email',
  'client_calle',
  'client_numero_calle',
  'client_numero_casa_depto',
  'client_region',
  'client_ciudad',
  'client_comuna',
  'client_giro',
  'updated_by',
];

// Helpers
const isEmail = (v: unknown) =>
  typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const normalizeNullable = (v: unknown) => {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  return v;
};

const cleanRut = (rut: string) => rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
const maybeValidRut = (rut: string) => {
  const r = cleanRut(rut);
  // validaciones livianas (formato largo 8-12)
  return r.length >= 8 && r.length <= 12;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { id, ...rest } = req.body || {};
    const numericId =
      typeof id === 'number' ? id : Number.isFinite(Number(id)) ? Number(id) : null;

    if (!numericId) {
      return res.status(400).json({ error: 'id numérico es requerido' });
    }

    // Traer cliente (asegura existencia)
    const current = await prisma.sap_client.findUnique({ where: { id: numericId } });
    if (!current) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Construir "data" sólo con claves permitidas
    const data: Partial<sap_client> = {};
    for (const k of UPDATABLE_KEYS) {
      if (Object.prototype.hasOwnProperty.call(rest, k)) {
        (data as any)[k] = normalizeNullable(rest[k]);
      }
    }

    // Si no vino updated_by en body, intentar desde header/x-user
    if (!('updated_by' in data)) {
      const headerUser = typeof req.headers['x-user'] === 'string' ? req.headers['x-user'] : null;
      if (headerUser) (data as any).updated_by = headerUser;
    }

    // Validaciones básicas
    if (data.client_email && !isEmail(data.client_email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (typeof data.client_rut === 'string' && !maybeValidRut(data.client_rut)) {
      return res.status(400).json({ error: 'RUT inválido (formato)' });
    }

    // Si el cliente ya fue creado en SAP (creation_response ≠ PENDING/ERROR),
    // permitimos editar datos locales igual (no bloqueamos), pero NO tocamos creation_response aquí.
    // Si querés bloquear edición post-SAP, descomenta:
    // if (current.creation_response && current.creation_response !== 'PENDING' && current.creation_response !== 'ERROR') {
    //   return res.status(409).json({ error: 'Cliente ya creado en SAP; edición bloqueada' });
    // }

    const updated = await prisma.sap_client.update({
      where: { id: numericId },
      data,
    });

    return res.status(200).json({
      success: true,
      message: 'Cliente actualizado',
      client: updated,
    });
  } catch (err: any) {
    // Errores Prisma comunes
    if (err?.code === 'P2002') {
      // Unique constraint (p.ej. client_rut)
      return res.status(409).json({
        error: 'Conflicto de unicidad (p. ej., RUT ya existe)',
        details: err?.meta,
        status: 409,
      });
    }
    if (err?.code === 'P2025') {
      return res.status(404).json({ error: 'Cliente no encontrado', status: 404 });
    }

    console.error('apiSAPClientUpdate error:', err);
    return res.status(500).json({
      error: 'Error interno',
      details: err?.message || String(err),
      status: 500,
    });
  } finally {
    await prisma.$disconnect();
  }
}
