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

export default async (req, res) => {
  const id = req.body.id ? req.body.id : req.query.id;
  const store = req.body.store ? req.body.store : req.query.store;
  const mode = req.body.mode ? req.body.mode : req.query.mode;
  const updatedData = req.body.updatedData ? req.body.updatedData : req.query.updatedData;
  const user = req.body.user ? req.body.user : "Ejecutivo de Cobranza";

  try {
    let apiClient;
    if (store === "Ventus") {
      apiClient = api;
    } else if (store === "BBQ") {
      apiClient = apiBBQ;
    } else if (store === "BLK") {
      apiClient = apiBLK;
    }

    if (mode === "get") {
      const { data } = await apiClient.get(`orders/${id}`);
      res.status(200).json(data);
    } else if (mode === "put") {
      const existingOrder = await apiClient.get(`orders/${id}`);
      const mergedData = merge(existingOrder.data, updatedData);
      const { data } = await apiClient.put(`orders/${id}`, updatedData);
      
      // Crear una nota de pedido
      await apiClient.post(`orders/${id}/notes`, {
        note: `El cambio de estado de En espera a Procesando fue realizado por: ${user}`,
        customer_note: false,
      });

      res.status(200).json(data);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
