//orders from woocommerce

import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const ordenes = [

  174076,
  174082,
  174085,
  174096,
  174101,
  174014,
  174110,
  174201,
  173486,
  173947,
  173953,
  174072,
  174080,
  174126,
  174133,
  174135,
  174145,
  174148,
  174160,
  174165,
  174185,
  173993,
  174197,
  174199,
  174224,
  174222,
  174239,
  174208,
  174341,
  

  

  

  
  

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
