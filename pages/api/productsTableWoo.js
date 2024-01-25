import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import axios from 'axios';

const woocommerceApi = new WooCommerceRestApi({
    url: process.env.URL_STORE_DATA,
    consumerKey: process.env.WOO_CLIENT,
    consumerSecret: process.env.WOO_SECRET,
    version: "wc/v3",
});



const getSAPData = async (sku) => {
  const SAP_USER = process.env.SAP_USER;
  const SAP_PASSWORD = process.env.SAP_PASSWORD;
  const SAP_URL = `http://20.83.154.218:8102/sap/opu/odata/sap/ZCDS_CUBE_INVENTARIO_CDS/ZCDS_CUBE_INVENTARIO(Material='${sku}',werks='1100',lgort='1014')`;

  try {
    const response = await axios.get(SAP_URL, {
      auth: {
        username: SAP_USER,
        password: SAP_PASSWORD
      }
    });

    return { sku, name: response.data.d.MaterialName, quantity: response.data.d.labst ,comprometido: response.data.d.stock_Comp, disponible: response.data.d.stock_disp }; // Devuelve solo el SKU y el nombre del material
  } catch (error) {
    throw new Error(error.message);
  }
};

export default async (req, res) => {
    const maxSkusPorLote = 210; // Límite de SKUs por lote a procesar
    let ultimoIndexProcesado = 0; // Índice del último SKU procesado
    let totalSkusProcesados = 0; // Total de SKUs procesados
    const perPage = 100;
    let currentPage = 1;
    let productsExist = true;

    while (productsExist) {
        const skus = [];
        try {
            while (productsExist && skus.length < maxSkusPorLote) {
                const { data } = await woocommerceApi.get("products", {
                    per_page: perPage,
                    page: currentPage,
                    status: "publish",
                    orderby: "date",
                    order: "desc",
                });

                data.forEach((product, index) => {
                    if (product.sku.length === 6 && index >= ultimoIndexProcesado && skus.length < maxSkusPorLote) {
                        skus.push(product.sku);
                    }
                });

                if (data.length < perPage || skus.length >= maxSkusPorLote) {
                    productsExist = false;
                } else {
                    currentPage++;
                }
            }

            if (skus.length > 0) {
                const results = await Promise.all(skus.map(sku => getSAPData(sku)));
                res.status(200).json(results);
                totalSkusProcesados += skus.length;
                ultimoIndexProcesado = totalSkusProcesados % perPage;
            } else {
                res.status(404).json({ message: "No SKUs found with 6 characters" });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};




