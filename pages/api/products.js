//products from woocommerce

import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const api = new WooCommerceRestApi({
    url: process.env.URL_STORE_DATA,
    consumerKey: process.env.WOO_CLIENT,
    consumerSecret: process.env.WOO_SECRET,
    version: "wc/v3",
});

//const { perPage, page } = useState(10, 1);

export default async (req, res) => {
    console.log(req.body.first)
    const sku = req.body.first
    
    try {
        const { data } = await api.get("products",
{
                    per_page: 100,
                    page:  5,
                    status: "publish",
                    orderby: "date",
                    order: "desc",
                    });
    res.status(200).json(data);
} catch (error) {
    res.status(500).json({ error: error.message });
}
};

