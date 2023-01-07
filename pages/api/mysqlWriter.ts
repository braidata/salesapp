//prisma api connector
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { array } from "yup";

//sending data to prisma
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = req.body.user;
  const dealId = req.body.dealId
  const ownerId = req.body.ownerId
  const customer_name = req.body.customer_name;
  const customer_last_name = req.body.customer_last_name;
  const customer_rut = req.body.customer_rut;
  const customer_email = req.body.customer_email;
  const customer_phone = req.body.customer_phone;
  const billing_street = req.body.billing_street;
  const billing_number = req.body.billing_number;
  const billing_commune = req.body.billing_commune;
  const billing_city = req.body.billing_city;
  const billing_region = req.body.billing_region;
  const billing_department = req.body.billing_department;
  const billing_zip_code = req.body.billing_zip_code;
  const billing_company_name = req.body.billing_company_name;
  const billing_company_rut = req.body.billing_company_rut;
  const billing_company_business = req.body.billing_company_business;
  const Shipping_Tipo_de_Despacho = req.body.Shipping_Tipo_de_Despacho;
  const Shipping_Fecha_de_Despacho_o_Retiro =
    req.body.Shipping_Fecha_de_Despacho_o_Retiro;
  const Shipping_Rut_Retira = req.body.Shipping_Rut_Retira;
  const Shipping_Nombre_Retira = req.body.Shipping_Nombre_Retira;
  const Shipping_Observacion = req.body.Shipping_Observacion;
  const Shipping_flete = req.body.Shipping_flete;
  const Shipping_street = req.body.Shipping_street;
  const Shipping_number = req.body.Shipping_number;
  const Shipping_department = req.body.Shipping_department;
  const Shipping_region = req.body.Shipping_region;
  const Shipping_city = req.body.Shipping_city;
  const Shipping_commune = req.body.Shipping_commune;
  const Shipping_zip_code = req.body.Shipping_zip_code;
  const method = req.body.method;
  const authorization_code = req.body.authorization_code;
  const payment_count = req.body.payment_count;
  const payment_amount = req.body.payment_amount;
  const payment_date = req.body.payment_date;
  const order_items = req.body.order_items;

  

  

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
        dealId,
        ownerId,
        payments: {
          create: {
            method,
            authorization_code,
            payment_count,
            payment_amount,
            payment_date
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
    console.log("El error ", error.meta); 
    
  }
}
