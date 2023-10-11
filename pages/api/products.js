import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const api = new WooCommerceRestApi({
    url: process.env.URL_STORE_DATA,
    consumerKey: process.env.WOO_CLIENT,
    consumerSecret: process.env.WOO_SECRET,
    version: "wc/v3",
});

export default async (req, res) => {
    const skuToIdMap = {};
    const perPage = 100;
    let currentPage = 1;
    let productsExist = true;

    try {
        while (productsExist) {
            const { data } = await api.get("products", {
                per_page: perPage,
                page: currentPage,
                status: "publish",
                orderby: "date",
                order: "desc",
            });

            if (data.length) {
                data.forEach(product => {
                    skuToIdMap[product.sku] = product.id;
                });
                currentPage++;
            } else {
                productsExist = false;
            }
        }

        res.status(200).json(skuToIdMap);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};




