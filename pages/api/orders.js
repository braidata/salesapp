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

  const ordenes = req.body ? req.body.order_ids : [

    173565,
    173655,
    173916,
    174643,
    174557,
    174559,
    174566,
    174584,
    174555,
    174549,
    174587,
    174606,
    174608,
    174634,
    174646,
    174342,
    174577,
    174576,
    174552,
    173157,
    172140,
    172766,
   ];
   console.log("ordenadno" , ordenes);
  try {
    const { data } = await api.put("orders/batch", {
      update: ordenes.map((id) => ({
        id,
        status: "invoiced",
      })),
    });
    // 
    res.status(200).json(data.update.map((order, index) => ({
      id: order.id,
      phone: order.billing.phone,
      city: order.shipping.city,
      meta_data: order.meta_data.filter((meta) => meta.key === "_fedex_integracion").map((meta) => meta.value),
      //meta_data2: order.meta_data.filter((meta) => meta.key === "_shipping_comuna").map((meta) => meta.value),
      method: order.shipping_lines[0].method_title,
      
    })));
    // console.log(data.update.map((order, index) => order.id + " " + order.billing.phone + " " +order.meta_data.map(
    //   (meta) => meta.key === "_fedex_integracion" ? meta.value
    //   : null
    // )) );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//
