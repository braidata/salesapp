// api/getSAPDetails.js

import axios from 'axios';

// Función separada para obtener los datos de ventas de SAP
async function fetchSAPSalesDetails(salesOrder, salesOrderItem) {
  const SAP_USER = process.env.SAP_USER;
  const SAP_PASSWORD = process.env.SAP_PASSWORD;
  // Asegúrate de actualizar la URL a la entidad correcta y parámetros para ventas
  const SAP_URL = `https://sapwdp.imega.cl:44300/sap/opu/odata/sap/ZCDS_CUBE_PEDIDOS_CDS/ZCDS_CUBE_PEDIDOS?$filter=SalesOrder%20eq%20%27${salesOrder}%27`;
  //https://sapwdp.imega.cl:44300/sap/opu/odata/sap/ZCDS_CUBO_VENTAS_CDS/ZCDS_CUBO_VENTAS?$filter=SalesOrder%20eq%20%27121578%27

  const response = await axios.get(SAP_URL, {
    auth: {
      username: SAP_USER,
      password: SAP_PASSWORD
    }
  });

  // Ajusta los campos en función de la respuesta de tu servicio OData de ventas
  return {
    data: response.data.d,
  };
}

// API Endpoint
const getSAPSalesData = async (req, res) => {
  try {
    // Asegúrate de que los parámetros que esperas son pasados correctamente a la función
    const { salesOrder, salesOrderItem } = req.query;
    const data = await fetchSAPSalesDetails(salesOrder, salesOrderItem);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default getSAPSalesData;
