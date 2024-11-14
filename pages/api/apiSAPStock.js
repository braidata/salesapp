import axios from 'axios';
import packs from '../../utils/packs.json';

export default async (req, res) => {
  const { Material, werks, lgort, chunkSize = 500 } = req.query;

  const SAP_USER = process.env.SAP_USER;
  const SAP_PASSWORD = process.env.SAP_PASSWORD;

  const buildFilterPart = (param, paramName) => {
    if (!param) return '';
    const values = param.split(',');
    const filterParts = values.map(value => `${paramName} eq '${value.trim()}'`);
    return filterParts.length > 1 ? `(${filterParts.join(' or ')})` : filterParts[0];
  };

  try {
    let materialsToCheck = [Material];
    
    // Mirá si es un pack, gurí
    if (packs[Material]) {
      const components = packs[Material].components;
      const componentSkus = components.map(c => c.sku);
      materialsToCheck = [...materialsToCheck, ...componentSkus];
    }

    const materialFilter = buildFilterPart(materialsToCheck.join(','), 'Material');
    const werksFilter = buildFilterPart(werks, 'werks');
    const lgortFilter = buildFilterPart(lgort, 'lgort');

    const filters = [materialFilter, werksFilter, lgortFilter].filter(Boolean).join(' and ');

    const SAP_URL = `http://172.190.174.6:8001/sap/opu/odata/sap/ZCDS_CUBE_INVENTARIO_CDS/ZCDS_CUBE_INVENTARIO?$filter=${filters}&$select=Material,MaterialName,werks,lgort,labst,stock_disp,stock_Comp`;

    const response = await axios.get(SAP_URL, {
      auth: {
        username: SAP_USER,
        password: SAP_PASSWORD,
      },
    });

    const stockData = response.data.d.results;

    // Si es un pack, calculamos el stock disponible
    if (packs[Material]) {
      const components = packs[Material].components;
      const packStock = components.map(component => {
        const componentStock = stockData.find(item => item.Material === component.sku);
        if (!componentStock) return 0;
        return Math.floor(parseFloat(componentStock.stock_disp) / component.quantity);
      });

      // El stock del pack lo limita el componente con menos stock, viste
      const availablePackStock = Math.min(...packStock);

      return res.json([{
        Material: Material,
        MaterialName: `Pack ${Material}`,
        werks: werks,
        lgort: lgort,
        stock_disp: availablePackStock.toString(),
        is_pack: true
      }]);
    }

    return res.json(stockData);

  } catch (error) {
    console.error('Che, hubo un error al traer los datos de SAP', error);
    return res.status(500).json({ error: 'La quedamo con el stock' });
  }
};