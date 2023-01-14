//orders from woocommerce

import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const ordenes = [
  172102, 172207, 172210, 172308, 172309, 172319, 172332, 172337, 172351,
  172356, 172359, 172368, 172369, 172374, 172375, 172376, 172379, 172386,
  172392, 172397, 172412, 172415, 172423, 172437, 172444, 172446, 172451,
  172455, 172456, 172467, 172472, 172473, 172474, 172475, 172480, 172482,
  172483, 172485, 172488, 172491, 172494, 172496, 172502, 172504, 172516,
  172553, 172566, 172584, 172589, 172591, 172617, 172624, 172627, 172642,
  172643, 172650, 172653, 172665, 172672, 172675, 172680, 172681, 172688,
  172710, 172716
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
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//
