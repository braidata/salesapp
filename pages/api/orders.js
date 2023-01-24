//orders from woocommerce

import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const ordenes = [
  172291,
,172280
,172257
,172251
,172231
,172223
,172222
,172219
,172211
,172168
,172156
,172155
,172140
,172139
,172363
,172115
,173060
,173079
,173093
,173094
,173088
,173106
,173107
,173115
,173116
,173119
,173120
,173123
,173132
,173133
,173137
,173095
,173117
,172773
,173135
,173148
,173147
,172249
,173026
,172884
,173225
,173182
,173162

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
