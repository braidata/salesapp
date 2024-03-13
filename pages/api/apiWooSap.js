// Importa las APIs necesarias
import getWooCommerceSkus from './productsTableWoo';
import getSAPDetails from './apiSAPValidator';

// Nueva API para obtener datos combinados de WooCommerce y SAP
export default async (req, res) => {
    try {
        // Obtiene SKUs de WooCommerce
        const skus = await getWooCommerceSkus(req, res);
        

        // Prepara un array para almacenar los datos combinados
        const combinedData = [];

        // Para cada SKU, obtiene detalles de SAP y combina la información
        for (const sku of skus) {
            
            const sapDetails = await getSAPDetails({ query: { sku } }, res);
            combinedData.push({ sku, ...sapDetails });

            console.log("gatos",combinedData);
        }

        // Envía la respuesta combinada
        res.status(200).json(combinedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};