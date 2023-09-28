//prisma api connector
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { array } from "yup";

//sending data to prisma
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

const user = req.body.user ? req.body.user : null;
const team = req.body.team ? req.body.team : null;
const dealId = req.body.dealId ? req.body.dealId : null;
const statusSAP = req.body.statusSAP ? req.body.statusSAP : 'Procesando';
const ownerId = req.body.ownerId ? req.body.ownerId : 222;
const customer_name = req.body.customer_name ? req.body.customer_name : null;
const customer_last_name = req.body.customer_last_name ? req.body.customer_last_name : null;
const customer_rut = req.body.customer_rut ? req.body.customer_rut : null;
const customer_email = req.body.customer_email;
const customer_phone = req.body.customer_phone ? req.body.customer_phone : null;
const billing_street = req.body.billing_street;
const billing_number = req.body.billing_number;
const billing_commune = req.body.billing_commune;
const billing_city = "ver comuna";
const billing_region = "ver comuna";
const billing_department = req.body.billing_department ? req.body.billing_department : null;
const billing_zip_code = req.body.billing_zip_code;
const billing_company_name = req.body.billing_company_name;
const billing_company_rut = req.body.billing_company_rut;
const billing_company_business = req.body.billing_company_business;
const Shipping_Tipo_de_Despacho = req.body.Shipping_Tipo_de_Despacho ? req.body.Shipping_Tipo_de_Despacho : null;
const Shipping_Fecha_de_Despacho_o_Retiro = req.body.Shipping_Fecha_de_Despacho_o_Retiro ? req.body.Shipping_Fecha_de_Despacho_o_Retiro : null;
const Shipping_Rut_Retira = req.body.Shipping_Rut_Retira ? req.body.Shipping_Rut_Retira : null;
const Shipping_Nombre_Retira = req.body.Shipping_Nombre_Retira ? req.body.Shipping_Nombre_Retira : null;
const Shipping_Observacion = req.body.Shipping_Observacion ? req.body.Shipping_Observacion : null;
const Shipping_flete = req.body.Shipping_flete ? req.body.Shipping_flete : null;
const Shipping_street = req.body.Shipping_street ? req.body.Shipping_street : null;
const Shipping_number = req.body.Shipping_number ? req.body.Shipping_number : null;
const Shipping_department = req.body.Shipping_department ? req.body.Shipping_department : null;
const Shipping_region = req.body.Shipping_region ? req.body.Shipping_region : 'ver comuna de envío';
const Shipping_city = req.body.Shipping_city ? req.body.Shipping_city : 'ver comuna de envío';
const Shipping_commune = req.body.Shipping_commune ? req.body.Shipping_commune : null;
const Shipping_zip_code = req.body.Shipping_zip_code ? req.body.Shipping_zip_code : null;
const method = req.body.method ? req.body.method : null;
const type = req.body.type ? req.body.type : null;
const centro = req.body.centro ? req.body.centro : null;
const almacen = req.body.almacen ? req.body.almacen : null;
const channel = req.body.canal ? req.body.canal : null;
const order_class = req.body.clase ? req.body.clase : null;
const authorization_code = req.body.authorization_code ? req.body.authorization_code : null;
const payment_count = req.body.payment_count ? req.body.payment_count : null;
const payment_amount = req.body.payment_amount ? req.body.payment_amount : null;
const payment_date = req.body.payment_date ? req.body.payment_date : null;
const rut_pagador = req.body.rut_pagador ? req.body.rut_pagador : null;
const OC = req.body.OC ? req.body.OC : null;
const order_items = req.body.order_items;






function tresDecimales(numero: any) {
  if (typeof numero === "string") {
      numero = numero.replace(",", ".");
  }
  numero = parseFloat(numero);
  let redondeado = Math.round(numero * 1000) / 1000;
  let str = redondeado.toString();
  let partes = str.split('.');
  if (partes.length === 1) {
      return str + '.000';
  }
  while (partes[1].length < 3) {
      partes[1] += '0';
  }
  return partes.join('.');
}

// Aplicar la función al campo discount de cada ítem
const productos = order_items
  .filter(
      (thing: any, index: any, self: any) =>
          index ===
          self.findIndex(
              (t: any) =>
                  t.name === thing.name &&
                  t.price !== undefined &&
                  t.quantity !== undefined &&
                  t.sku !== undefined &&
                  t.discount !== undefined
          )
  )
  .map((item: any) => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      sku: item.sku,
      discount: tresDecimales(item.discount),  // Aplicar la función aquí
  }));

  const prisma = new PrismaClient();
  //data types

  try {
    const orderA = await prisma.orders.create({



      data: {
        customer_name,
        customer_last_name,
        customer_rut,
        customer_email,
        customer_phone,
        billing_street,
        billing_number,
        billing_commune,
        billing_city,
        billing_region,
        billing_department,
        billing_zip_code,
        billing_company_name,
        billing_company_rut,
        billing_company_business,
        Shipping_Tipo_de_Despacho,
        Shipping_Fecha_de_Despacho_o_Retiro,
        Shipping_Rut_Retira,
        Shipping_Nombre_Retira,
        Shipping_Observacion,
        Shipping_flete,
        Shipping_street,
        Shipping_number,
        Shipping_department,
        Shipping_region,
        Shipping_city,
        Shipping_commune,
        Shipping_zip_code,
        user,
        team,
        centro,
        almacen,
        channel,
        order_class,
        dealId,
        ownerId,
        statusSAP,
        OC,
        payments: {
          create: {
            method,
            type,
            rut_pagador,
            authorization_code,
            payment_count,
            payment_amount,
            payment_date,

          }
        },

        order_items: {
          create: productos,
        },
      },
    });

    const orders = await prisma.orders.findMany();

    //console.log("DATOTES", orders, orderA);

    res.status(200).json(orders);
  } catch (error: any) {

    res.status(500).json([error.code, error.meta, error.message]);
    console.log("El error ", error);

  }
  finally {
    await prisma.$disconnect();
  }
}
