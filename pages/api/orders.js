//orders from woocommerce

import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const ordenes = [

  172316,
172675,
174044,
174059,

  

  

  
  

];

const api = new WooCommerceRestApi({
  url: process.env.URL_STORE_DATA,
  consumerKey: process.env.WOO_CLIENT,
  consumerSecret: process.env.WOO_SECRET,
  version: "wc/v3",
});

//change status of order for each order in the order array
export default async (req, res) => {
  try {
    const { data } = await api.put("orders/batch", {
      update: ordenes.map((id) => ({
        id,
        status: "invoiced",
      })),
    });
    res.status(200).json(data.update.map((order, index) => order.id + " " + order.billing.phone + " " +order.meta_data.map(
      (meta) => meta.key === "_fedex_integracion" ? meta.value
      : null
    )) );
    // console.log(data.update.map((order, index) => order.id + " " + order.billing.phone + " " +order.meta_data.map(
    //   (meta) => meta.key === "_fedex_integracion" ? meta.value
    //   : null
    // )) );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//
