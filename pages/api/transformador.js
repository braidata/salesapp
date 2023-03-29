import { NextApiRequest, NextApiResponse } from 'next';

const processNestedObject = (obj, parentKey, transformedData) => {
  for (const key in obj) {
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      processNestedObject(obj[key], `${parentKey}_${key}`, transformedData);
    } else {
      const item = { key: `${parentKey}_${key}`, placeholder: `Ejemplo: ${obj[key]}` };
      transformedData.push(item);
    }
  }
};

const handler = async (req, res) => {


const orderData = {
    status: "on-hold",
    billing: {
      first_name: "LOCALES Y COMERCIO",
      last_name: "BLF DOS SPA",
      address_1: "matias cousio",
      city: "METROPOLITANA",
      state: "43",
      country: "CL",
      email: "contacto@binomiosbar.cl",
      phone: "+56 9 9545 4720"
    },
    shipping: {
      first_name: "LOCALES Y COMERCIO",
      last_name: "BLF DOS SPA",
      address_1: "matias cousio",
      city: "METROPOLITANA",
      state: "43",
      country: "CL"
    },
    payment_method: "bacs",
    payment_method_title: "Transferencia Bancaria",
    meta_data: [
      {
        key: "_billing_documento",
        value: "factura"
      },
      {
        key: "_billing_rut",
        value: "77328906-9"
      },
      {
        key: "_billing_RUT_Empresa",
        value: "77328906-9"
      },
      {
        key: "_billing_giro",
        value: "cafeteria"
      },
      {
        key: "_billing_razon_social",
        value: "LOCALES Y COMERCIO BLF DOS SPA"
      },
      {
        key: "_shipping_comuna",
        value: "SANTIAGO CENTRO"
      },
      {
        key: "_shipping_Numero_Direccion",
        value: "119"
      },
      {
        key: "_retiro_local_rut",
        value: "13069905-7"
      },
      {
        key: "_retiro_local_name",
        value: "Rodrigo Gonzalez"
      },
      {
        key: "_retiro_local_date",
        value: "24-03-2023"
      }
    ],
  };


  const transformedData = [];

  for (const key in orderData) {
    if (orderData.hasOwnProperty(key)) {
      if (key === 'meta_data') {
        orderData[key].forEach((metaItem) => {
          const item = { key: metaItem.key, placeholder: `Ejemplo: ${metaItem.value}` };
          transformedData.push(item);
        });
      } else if (typeof orderData[key] === 'object' && !Array.isArray(orderData[key])) {
        processNestedObject(orderData[key], key, transformedData);
      } else {
        const item = { key: key, placeholder: `Ejemplo: ${orderData[key]}` };
        transformedData.push(item);
      }
    }
  }

  res.status(200).json(transformedData);
};

export default handler;