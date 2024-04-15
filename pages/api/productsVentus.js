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

// Change status of product for each product in the product array
export default async (req, res) => {
  const id = req.body.id ? req.body.id : req.query.id;
  const store = req.body.store ? req.body.store : req.query.store;
  const mode = req.body.mode ? req.body.mode : req.query.mode;
  const updatedData = req.body.updatedData ? req.body.updatedData : req.query.updatedData;

  console.log(req.body);

  // example url: https://test-ventus-sales.ventuscorp.cl/api/

  try {
    if (store === "Ventus") {
      if (mode === "get") {
        const { data } = await api.get(`products/${id}`);
        res.status(200).json(data);
      } else if (mode === "put") {
        const existingProduct = await api.get(`products/${id}`);
        const mergedData = merge(existingProduct.data, updatedData);
        const { data } = await api.put(`products/${id}`, updatedData);
        res.status(200).json(data);
      }
    } else if (store === "BBQ") {
      if (mode === "get") {
        const { data } = await apiBBQ.get(`products/${id}`);
        res.status(200).json(data);
      } else if (mode === "put") {
        const existingProduct = await apiBBQ.get(`products/${id}`);
        const mergedData = merge(existingProduct.data, updatedData);
        const { data } = await apiBBQ.put(`products/${id}`, updatedData);
        res.status(200).json(data);
      }
    } else if (store === "BLK") {
      if (mode === "get") {
        const { data } = await apiBLK.get(`products/${id}`);
        res.status(200).json(data);
      } else if (mode === "put") {
        const existingProduct = await apiBLK.get(`products/${id}`);
        const mergedData = merge(existingProduct.data, updatedData);
        const { data } = await apiBLK.put(`products/${id}`, updatedData);
        res.status(200).json(data);
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};