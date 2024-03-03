// api/getSAPDetails.js

import axios from 'axios';

// Función separada para obtener los datos de SAP
async function fetchSAPDetails(sku) {
  const SAP_USER = process.env.SAP_USER;
  const SAP_PASSWORD = process.env.SAP_PASSWORD;
  const SAP_URL = `http://20.83.154.218:8102/sap/opu/odata/sap/ZCDS_CUBE_INVENTARIO_CDS/ZCDS_CUBE_INVENTARIO(Material='${sku}',werks='1500',lgort='1520')`;

  const response = await axios.get(SAP_URL, {
    auth: {
      username: SAP_USER,
      password: SAP_PASSWORD
    }
  });

  return { sku, name: response.data.d.MaterialName , werks: response.data.d.werks, almacen: response.data.d.lgort , stock: response.data.d.stock_disp};
}

// API Endpoint
const getSAPData = async (req, res) => {
  try {
    const { sku } = req.query;
    const data = await fetchSAPDetails(sku);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default getSAPData;

