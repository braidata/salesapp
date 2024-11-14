import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import fs from 'fs';
import path from 'path';
import skuID from '../../utils/skuID.json';

const api = new WooCommerceRestApi({
    url: process.env.URL_STORE_DATA,
    consumerKey: process.env.WOO_CLIENT,
    consumerSecret: process.env.WOO_SECRET,
    version: "wc/v3",
});

export default async (req, res) => {

    const action = req.body.action || req.query.action; // "get" o "edit"
    const sku = req.body.sku || req.query.sku; // SKU proporcionado en la solicitud
    const updateData = req.body.data; // Datos para editar el producto

    // Leer el mapeo SKU a ID desde el archivo skuID.json
    const skuFilePath = path.join(process.cwd(), 'utils', 'skuID.json');
    const skuList = JSON.parse(fs.readFileSync(skuFilePath, 'utf8'));
    
    // Convertir la lista en un mapeo para fácil acceso
    const skuToIdMap = {};
    skuList.forEach(item => {
        skuToIdMap[item.SKU] = item.ID;
    });

    const productId = skuToIdMap[sku];

    if (!productId) {
        return res.status(404).json({ error: "Product not found" });
    }

    try {
        if (action === "get") {
            const { data: product } = await api.get(`products/${productId}`);
            res.status(200).json(product);
        } else if (action === "edit" && updateData) {
            const { data: updatedProduct } = await api.put(`products/${productId}`, updateData);
            res.status(200).json(updatedProduct);
        } else {
            res.status(400).json({ error: "Invalid request" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


