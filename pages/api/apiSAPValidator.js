import axios from 'axios';

export default async (req, res) => {
  const { Material, werks, lgort } = req.query;

  const SAP_USER = process.env.SAP_USER;
  const SAP_PASSWORD = process.env.SAP_PASSWORD;

  const SAP_URL = `http://172.190.174.6:8001/sap/opu/odata/sap/ZCDS_CUBE_INVENTARIO_CDS/ZCDS_CUBE_INVENTARIO(Material='${Material}',werks='${werks}',lgort='${lgort}')`;

  try {
    const response = await axios.get(SAP_URL, {
      auth: {
        username: SAP_USER,
        password: SAP_PASSWORD
      },
    });

    const data = response.data.d;
    //console.log("data",data)

    const result = {
      Material: data.Material,
      werks: data.werks,
      lgort: data.lgort,
      stock_disp: data.stock_disp,
      
    };

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}