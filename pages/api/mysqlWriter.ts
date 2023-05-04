//prisma api connector
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { array } from "yup";

//sending data to prisma
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // const user = req.body.user;
  // const team = req.body.team;
  // const dealId = req.body.dealId
  // const ownerId = req.body.ownerId
  // const ownerIdM = req.body.ownerIdM
  // const customer_name = req.body.customer_name;
  // const customer_last_name = req.body.customer_last_name;
  // const customer_rut = req.body.customer_rut;
  // const customer_email = req.body.customer_email;
  // const customer_phone = req.body.customer_phone;
  // const billing_street = req.body.billing_street;
  // const billing_number = req.body.billing_number;
  // const billing_commune = req.body.billing_commune;
  // const billing_city = "ver comuna";
  // const billing_region = "ver comuna";
  // const billing_department = req.body.billing_department;
  // const billing_zip_code = req.body.billing_zip_code;
  // const billing_company_name = req.body.billing_company_name;
  // const billing_company_rut = req.body.billing_company_rut;
  // const billing_company_business = req.body.billing_company_business;
  // const Shipping_Tipo_de_Despacho = req.body.Shipping_Tipo_de_Despacho;
  // const Shipping_Fecha_de_Despacho_o_Retiro =
  //   req.body.Shipping_Fecha_de_Despacho_o_Retiro;
  // const Shipping_Rut_Retira = req.body.Shipping_Rut_Retira;
  // const Shipping_Nombre_Retira = req.body.Shipping_Nombre_Retira;
  // const Shipping_Observacion = req.body.Shipping_Observacion;
  // const Shipping_flete = req.body.Shipping_flete;
  // const Shipping_street = req.body.Shipping_street;
  // const Shipping_number = req.body.Shipping_number;
  // const Shipping_department = req.body.Shipping_department;
  // const Shipping_region = "ver comuna de envío";
  // const Shipping_city = "ver comuna de envío";
  // const Shipping_commune = req.body.Shipping_commune;
  // const Shipping_zip_code = req.body.Shipping_zip_code;
  // const method = req.body.method;
  // const authorization_code = req.body.authorization_code;
  // const payment_count = req.body.payment_count;
  // const payment_amount = req.body.payment_amount;
  // const payment_date = req.body.payment_date;
  // const rut_pagador = req.body.rut_pagador;
  // const statusSAP = req.body.statusSAP;
  // const OC = req.body.OC;
  // const order_items = req.body.order_items;

  const user = req.body.user ? req.body.user : 'sin usuario';
const team = req.body.team ? req.body.team : 'sin equipo';
const dealId = req.body.dealId ? req.body.dealId : 'sin DealId';
const statusSAP = req.body.statusSAP ? req.body.statusSAP : 'Procesando';
const ownerId = req.body.ownerId ? req.body.ownerId : 222;
const customer_name = req.body.customer_name ? req.body.customer_name : 'sin nombre';
const customer_last_name = req.body.customer_last_name ? req.body.customer_last_name : 'sin apellido';
const customer_rut = req.body.customer_rut ? req.body.customer_rut : 'sin RUT';
const customer_email = req.body.customer_email
const customer_phone = req.body.customer_phone ? req.body.customer_phone : 'sin teléfono';
const billing_street = req.body.billing_street;
const billing_number = req.body.billing_number;
const billing_commune = req.body.billing_commune;
const billing_city = "ver comuna";  
const billing_region = "ver comuna";  
const billing_department = req.body.billing_department ? req.body.billing_department :'sin departamento de facturación';
const billing_zip_code = req.body.billing_zip_code 
const billing_company_name = req.body.billing_company_name
const billing_company_rut = req.body.billing_company_rut
const billing_company_business = req.body.billing_company_business
const Shipping_Tipo_de_Despacho = req.body.Shipping_Tipo_de_Despacho ? req.body.Shipping_Tipo_de_Despacho : 'sin tipo de despacho';
const Shipping_Fecha_de_Despacho_o_Retiro = req.body.Shipping_Fecha_de_Despacho_o_Retiro ? req.body.Shipping_Fecha_de_Despacho_o_Retiro : 'sin fecha de despacho o retiro';
const Shipping_Rut_Retira = req.body.Shipping_Rut_Retira ? req.body.Shipping_Rut_Retira : 'sin RUT de quien retira';
const Shipping_Nombre_Retira = req.body.Shipping_Nombre_Retira ? req.body.Shipping_Nombre_Retira : 'sin nombre de quien retira';
const Shipping_Observacion = req.body.Shipping_Observacion ? req.body.Shipping_Observacion : 'sin observaciones de despacho';
const Shipping_flete = req.body.Shipping_flete ? req.body.Shipping_flete : 'sin costo de flete';
const Shipping_street = req.body.Shipping_street ? req.body.Shipping_street : 'sin calle de envío';
const Shipping_number = req.body.Shipping_number ? req.body.Shipping_number : 'sin número de envío';
const Shipping_department = req.body.Shipping_department ? req.body.Shipping_department : 'sin departamento de envío';
const Shipping_region = req.body.Shipping_region ? req.body.Shipping_region : 'ver comuna de envío';
const Shipping_city = req.body.Shipping_city ? req.body.Shipping_city : 'ver comuna de envío';
const Shipping_commune = req.body.Shipping_commune ? req.body.Shipping_commune : 'sin comuna de envío';
const Shipping_zip_code = req.body.Shipping_zip_code ? req.body.Shipping_zip_code : 'sin código postal de envío';
const method = req.body.method ? req.body.method : 'sin método de pago';
const type = req.body.type ? req.body.type : 'sin tipo de pago';
const centro = req.body.centro ? req.body.centro : 'sin centro';
const almacen = req.body.almacen ? req.body.almacen : 'sin almacén';
const channel = req.body.canal ? req.body.canal : 'sin canal';
const order_class = req.body.clase ? req.body.clase : 'sin clase';
const authorization_code = req.body.authorization_code ? req.body.authorization_code : 'sin código de autorización';
const payment_count = req.body.payment_count ? req.body.payment_count : 'sin conteo de pagos';
const payment_amount = req.body.payment_amount ? req.body.payment_amount : 'sin cantidad de pagos';
const payment_date = req.body.payment_date ? req.body.payment_date : 'sin fecha de pago';
const rut_pagador = req.body.rut_pagador ? req.body.rut_pagador : 'sin RUT del pagador';
const OC = req.body.OC ? req.body.OC : 'sin OC';
const order_items = req.body.order_items






  const productos = order_items
    .filter(
      //filtrar repetido
      (thing: any, index: any, self: any) =>
        index ===
        self.findIndex(
          (t: any) =>
            t.name === thing.name &&
            t.price !== undefined &&
            t.quantity !== undefined &&
            t.sku !== undefined
        )
    )
    .map((item: any) => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      sku: item.sku,
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
