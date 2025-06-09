// pages/api/mysqlConsultaSAP.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from "@prisma/client";
import atob from 'atob';

// Definir globalmente atob si no está definido
if (typeof global.atob === 'undefined') {
  global.atob = atob;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo permitimos GET con query param “orderId”
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido. Use GET." });
  }

  const { orderId } = req.query;
  if (!orderId || Array.isArray(orderId)) {
    return res.status(400).json({ error: "Falta parámetro orderId en la URL." });
  }

  // Intentamos parsear a número; si tu “id” en Prisma no es numérico,
  // reemplaza este bloque por el campo correcto (p. ej. { externalCode: orderId }).
  const idNum = orderId as string;
  if (isNaN(idNum)) {
    return res.status(400).json({ error: "orderId inválido." });
  }

  const prisma = new PrismaClient();
  try {
    // (Si quieres mantener la búsqueda de usuario como en el ejemplo original,
    // podrías leer name/email/id desde `req.query` aquí. Pero la petición
    // solo pide `orderId`, así que omitimos la parte de users.)

    const orders = await prisma.orders.findMany({
      select: {
        id: true,
        order_date: true,
        customer_name: true,
        customer_last_name: true,
        customer_email: true,
        customer_phone: true,
        customer_rut: true,
        Shipping_Fecha_de_Despacho_o_Retiro: true,
        Shipping_Tipo_de_Despacho: true,
        Shipping_city: true,
        Shipping_commune: true,
        Shipping_region: true,
        Shipping_street: true,
        Shipping_number: true,
        Shipping_department: true,
        payments: true,
        order_items: true,
        user: true,
        statusSAP: true,
        billing_company_name: true,
        billing_company_rut: true,
        billing_city: true,
        billing_commune: true,
        billing_region: true,
        billing_street: true,
        billing_number: true,
        billing_department: true,
        respuestaSAP: true,
        dealId: true,
        almacen: true,
        order_class: true,
      },
      where: { id: idNum },
      orderBy: { order_date: 'desc' },
    });

    console.log("Consulta orden con ID:", idNum);
    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Error en mysqlConsultaSAP:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  } finally {
    await prisma.$disconnect();
  }
}
