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

    const orden = req.query ? req.query.id :  null
    const mode = req.query ? req.query.mode :  "get"
  try {
    
    if(mode === "get"){
    //GET ORDER BY ID
    const { data } = await api.get(`orders/${orden}`);

    console.log("la data", data)

    res.status(200).json(data);}
    else if(mode === "put"){
        const { data } = await api.put(`orders/${orden}`
        ,
        {
            meta_data: [
                {
                    key: "_shipping_Numero_dpto",
                    value: "88"
                    }
                    ]
                    }
                    );
        res.status(200).json(data);
    }


  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//