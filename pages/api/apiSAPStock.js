import axios from 'axios';

export default async (req, res) => {
  const { Material, werks, lgort } = req.query;

  const SAP_USER = process.env.SAP_USER;
  const SAP_PASSWORD = process.env.SAP_PASSWORD;

  // Función para construir parte del filtro basada en múltiples valores
  const buildFilterPart = (param, paramName) => {
    if (!param) return '';
    const values = param.split(','); // Asume que los valores vienen separados por comas
    const filterParts = values.map(value => `${paramName} eq '${value.trim()}'`);
    return `(${filterParts.join(' or ')})`;
  };

  const materialFilter = buildFilterPart(Material, 'Material');
  const werksFilter = buildFilterPart(werks, 'werks');
  const lgortFilter = buildFilterPart(lgort, 'lgort');

  const filters = [materialFilter, werksFilter, lgortFilter].filter(Boolean).join(' and ');
  const SAP_URL = `http://20.83.154.218:8102/sap/opu/odata/sap/ZCDS_CUBE_INVENTARIO_CDS/ZCDS_CUBE_INVENTARIO?$filter=${filters}`;

  try {
    const response = await axios.get(SAP_URL, {
      auth: {
        username: SAP_USER,
        password: SAP_PASSWORD,
      },
    });

    const data = response.data.d.results;
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

