//orders from woocommerce

import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";



const api = new WooCommerceRestApi({
  url: process.env.URL_STORE_DATA,
  consumerKey: process.env.WOO_CLIENT,
  consumerSecret: process.env.WOO_SECRET,
  version: "wc/v3",
});

//change status of order for each order in the order array
export default async (req, res) => {

    const orden = req.query ? req.query.orden :  177081
  try {
    // 
    //GET ORDER BY ID

    const { data } = await api.get(`orders/${orden}`);


    // const { data } = await api.get(`orders/${orden}`);
    // //      "key": "_billing_rut",
    // //"value": "13599982-2"


    // console.log("la data", data)


    res.status(200).json(data);
  
    // console.log(data.update.map((order, index) => order.id + " " + order.billing.phone + " " +order.meta_data.map(
    //   (meta) => meta.key === "_fedex_integracion" ? meta.value
    //   : null
    // )) );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//