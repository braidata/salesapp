//orders from woocommerce

import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const orden = 10686

const api = new WooCommerceRestApi({
  url: process.env.URL_STORE_DATABBQ,
  consumerKey: process.env.WOO_CLIENTBBQ,
  consumerSecret: process.env.WOO_SECRETBBQ,
  version: "wc/v3",
});

//change status of order for each order in the order array
export default async (req, res) => {
  try {
    // 
    //GET ORDER BY ID

    const { data } = await api.get(`orders/${orden}`);

    console.log("la data", data)


    res.status(200).json(data.meta_data.map(
        (meta) => meta.key === "_fedex_integracion" ? meta.value
        : null
    ));
  
    // console.log(data.update.map((order, index) => order.id + " " + order.billing.phone + " " +order.meta_data.map(
    //   (meta) => meta.key === "_fedex_integracion" ? meta.value
    //   : null
    // )) );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//