import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import merge from "lodash/merge";

const api = new WooCommerceRestApi({
  url: process.env.URL_STORE_DATA,
  consumerKey: process.env.WOO_CLIENT,
  consumerSecret: process.env.WOO_SECRET,
  version: "wc/v3",
});

const apiBBQ = new WooCommerceRestApi({
  url: process.env.URL_STORE_DATABBQ,
  consumerKey: process.env.WOO_CLIENTBBQ,
  consumerSecret: process.env.WOO_SECRETBBQ,
  version: "wc/v3",
});

const apiBLK = new WooCommerceRestApi({
  url: process.env.URL_STORE_DATABLK,
  consumerKey: process.env.WOO_CLIENTBLK,
  consumerSecret: process.env.WOO_SECRETBLK,
  version: "wc/v3",
});

const getApiForStore = (store) => {
  switch (store) {
    case "BBQ":
      return apiBBQ;
    case "BLK":
      return apiBLK;
    default:
      return api;
  }
};

const updateOrderWithMetaData = async (apiInstance, id, updatedData, user) => {
  const { data: existingOrder } = await apiInstance.get(`orders/${id}`);
  
  let newMetaData = existingOrder.meta_data || [];

  // Manejar la actualización de meta_data
  if (updatedData.meta_data) {
    Object.entries(updatedData.meta_data).forEach(([key, value]) => {
      const existingIndex = newMetaData.findIndex(item => item.key === key);
      if (existingIndex !== -1) {
        newMetaData[existingIndex].value = value;
      } else {
        newMetaData.push({ key, value });
      }
    });
  }

  // Crear el objeto de datos actualizado
  const mergedData = merge({}, updatedData, { meta_data: newMetaData });

  // Eliminar line_items si está presente
  delete mergedData.line_items;

  // Realizar la actualización
  const { data } = await apiInstance.put(`orders/${id}`, mergedData);
  
  // Agregar una nota al pedido
  await apiInstance.post(`orders/${id}/notes`, {
    note: `${user} modificó esto: ${JSON.stringify(updatedData, null, 2)}`,
    customer_note: false,
  });

  return data;
};

export default async (req, res) => {
  const { id, store, mode, updatedData, user = "Ejecutivo de Ecommerce" } = req.body || req.query;
  
  try {
    const apiInstance = getApiForStore(store);

    if (mode === "get") {
      const { data } = await apiInstance.get(`orders/${id}`);
      res.status(200).json(data);
    } else if (mode === "put") {
      const data = await updateOrderWithMetaData(apiInstance, id, updatedData, user);
      res.status(200).json(data);
    } else {
      res.status(400).json({ error: "Invalid mode" });
    }
  } catch (error) {
    console.error("Error en la API:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: error.response ? error.response.data : error.message });
  }
};
/**
 * // 20230322151043
// https://test-ventus-sales.ventuscorp.cl/api/ordersVentus?id=175887&rut=13069905-7&name=Rodrigo%20Gonzalez&mode=put

{
  "id": 175887,
  "parent_id": 0,
  "status": "on-hold",
  "currency": "CLP",
  "version": "7.5.0",
  "prices_include_tax": false,
  "date_created": "2023-03-22T14:39:32",
  "date_modified": "2023-03-22T14:39:32",
  "discount_total": "0",
  "discount_tax": "0",
  "shipping_total": "0",
  "shipping_tax": "0",
  "cart_tax": "0",
  "total": "449990",
  "total_tax": "0",
  "customer_id": 0,
  "order_key": "wc_order_rDKDGI4jq8P08",
  "billing": {
    "first_name": "LOCALES Y COMERCIO",
    "last_name": "BLF DOS SPA",
    "company": "",
    "address_1": "matias cousio",
    "address_2": "",
    "city": "METROPOLITANA",
    "state": "43",
    "postcode": "",
    "country": "CL",
    "email": "contacto@binomiosbar.cl",
    "phone": "+56 9 9545 4720"
  },
  "shipping": {
    "first_name": "LOCALES Y COMERCIO",
    "last_name": "BLF DOS SPA",
    "company": "",
    "address_1": "matias cousio",
    "address_2": "",
    "city": "METROPOLITANA",
    "state": "43",
    "postcode": "",
    "country": "CL",
    "phone": ""
  },
  "payment_method": "bacs",
  "payment_method_title": "Transferencia Bancaria",
  "transaction_id": "",
  "customer_ip_address": "200.27.40.226",
  "customer_user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.1661.41",
  "created_via": "checkout",
  "customer_note": "",
  "date_completed": null,
  "date_paid": null,
  "cart_hash": "8712d83f015627acc236b4370fe4d7c9",
  "number": "175887",
  "meta_data": [
    {
      "id": 6901247,
      "key": "_billing_documento",
      "value": "factura"
    },
    {
      "id": 6901248,
      "key": "_billing_fijo",
      "value": ""
    },
    {
      "id": 6901249,
      "key": "_billing_rut",
      "value": "77328906-9"
    },
    {
      "id": 6901250,
      "key": "_billing_RUT_Empresa",
      "value": "77328906-9"
    },
    {
      "id": 6901251,
      "key": "_billing_giro",
      "value": "cafeteria"
    },
    {
      "id": 6901252,
      "key": "_billing_razon_social",
      "value": "LOCALES Y COMERCIO BLF DOS SPA"
    },
    {
      "id": 6901253,
      "key": "_billing_Nombre_de_fantasia",
      "value": "LOCALES Y COMERCIO BLF DOS SPA"
    },
    {
      "id": 6901254,
      "key": "_billing_comuna",
      "value": "SANTIAGO CENTRO"
    },
    {
      "id": 6901255,
      "key": "_billing_Numero_Direccion",
      "value": "119"
    },
    {
      "id": 6901256,
      "key": "_billing_Numero_dpto",
      "value": ""
    },
    {
      "id": 6901257,
      "key": "_shipping_comuna",
      "value": "SANTIAGO CENTRO"
    },
    {
      "id": 6901258,
      "key": "_shipping_Numero_Direccion",
      "value": "119"
    },
    {
      "id": 6901259,
      "key": "_shipping_Numero_dpto",
      "value": ""
    },
    {
      "id": 6901260,
      "key": "is_vat_exempt",
      "value": "no"
    },
    {
      "id": 6901261,
      "key": "RUT",
      "value": "77328906-9"
    },
    {
      "id": 6901263,
      "key": "_ga_tracked",
      "value": "1"
    },
    {
      "id": 6901395,
      "key": "_retiro_local_rut",
      "value": "13069905-7"
    },
    {
      "id": 6901396,
      "key": "_retiro_local_name",
      "value": "Rodrigo Gonzalez"
    },
    {
      "id": 6901397,
      "key": "_retiro_local_date",
      "value": "24-03-2023"
    },
    {
      "id": 6901398,
      "key": "hubwoo_pro_guest_order",
      "value": "yes"
    }
  ],
  "line_items": [
    {
      "id": 186095,
      "name": "Horno Convector Eléctrico VHC1A",
      "product_id": 28430,
      "variation_id": 0,
      "quantity": 1,
      "tax_class": "",
      "subtotal": "449990",
      "subtotal_tax": "0",
      "total": "449990",
      "total_tax": "0",
      "taxes": [
        
      ],
      "meta_data": [
        {
          "id": 1609449,
          "key": "_regular_price",
          "value": "471990",
          "display_key": "_regular_price",
          "display_value": "471990"
        },
        {
          "id": 1609456,
          "key": "_reduced_stock",
          "value": "1",
          "display_key": "_reduced_stock",
          "display_value": "1"
        }
      ],
      "sku": "100873",
      "price": 449990,
      "image": {
        "id": "61198",
        "src": "https://ventuscorp.cl/wp-content/uploads/2019/10/Horno-Convector-Eléctrico-VHC-1A-1.jpg"
      },
      "parent_name": null,
      "composite_parent": "",
      "composite_children": [
        
      ],
      "bundled_by": "",
      "bundled_item_title": "",
      "bundled_items": [
        
      ]
    }
  ],
  "tax_lines": [
    
  ],
  "shipping_lines": [
    {
      "id": 186096,
      "method_title": "Envío gratuito",
      "method_id": "free_shipping",
      "instance_id": "33",
      "total": "0",
      "total_tax": "0",
      "taxes": [
        
      ],
      "meta_data": [
        {
          "id": 1609455,
          "key": "Artículos",
          "value": "Horno Convector Eléctrico VHC1A &times; 1",
          "display_key": "Artículos",
          "display_value": "Horno Convector Eléctrico VHC1A &times; 1"
        }
      ]
    }
  ],
  "fee_lines": [
    
  ],
  "coupon_lines": [
    
  ],
  "refunds": [
    
  ],
  "payment_url": "https://ventuscorp.cl/procesar-compra/order-pay/175887/?pay_for_order=true&key=wc_order_rDKDGI4jq8P08",
  "is_editable": true,
  "needs_payment": false,
  "needs_processing": true,
  "date_created_gmt": "2023-03-22T17:39:32",
  "date_modified_gmt": "2023-03-22T17:39:32",
  "date_completed_gmt": null,
  "date_paid_gmt": null,
  "currency_symbol": "$",
  "_links": {
    "self": [
      {
        "href": "https://ventuscorp.cl/wp-json/wc/v3/orders/175887"
      }
    ],
    "collection": [
      {
        "href": "https://ventuscorp.cl/wp-json/wc/v3/orders"
      }
    ]
  }
}
 */