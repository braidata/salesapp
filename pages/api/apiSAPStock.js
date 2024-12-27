import axios from 'axios';
import packs from '../../utils/packs.json';

export default async (req, res) => {
  const { Material, werks, lgort } = req.query;

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
    
    if (packs[Material]) {
      const components = packs[Material].components;
      const componentSkus = components.map(c => c.sku);
      materialsToCheck = [...materialsToCheck, ...componentSkus];
    }

    const materialFilter = buildFilterPart(materialsToCheck.join(','), 'Material');
    const werksFilter = buildFilterPart(werks, 'werks');
    const lgortFilter = buildFilterPart(lgort, 'lgort');

    const filters = [materialFilter, werksFilter, lgortFilter].filter(Boolean).join(' and ');

    const SAP_URL = `https://sapwdp.imega.cl:44300/sap/opu/odata/sap/ZCDS_CUBE_INVENTARIO_CDS/ZCDS_CUBE_INVENTARIO?$filter=${filters}&$select=Material,MaterialName,werks,lgort,labst,stock_disp,stock_Comp`;

    const response = await axios.get(SAP_URL, {
      auth: {
        username: SAP_USER,
        password: SAP_PASSWORD,
      },
    });

    const stockData = response.data.d.results;
    console.log('Data recibida de SAP:', stockData);

    if (packs[Material]) {
      const components = packs[Material].components;
      console.log('Componentes del pack:', components);

      const packStock = components.map(component => {
        const componentStock = stockData.find(item => item.Material === component.sku.toString());
        console.log(`Buscando stock para componente ${component.sku}:`, componentStock);

        const stockDisponible = componentStock ? parseFloat(componentStock.stock_disp) : 0;
        console.log(`Stock disponible para ${component.sku}:`, stockDisponible);
        console.log(`Cantidad requerida para ${component.sku}:`, component.quantity);

        const packsDisponibles = Math.floor(stockDisponible / component.quantity);
        console.log(`Packs disponibles calculados para ${component.sku}:`, packsDisponibles);

        return {
          sku: component.sku,
          stockDisponible,
          quantityPerPack: component.quantity,
          packsDisponibles
        };
      });

      console.log('Resultado del cálculo para cada componente:', packStock);

      const availablePackStock = Math.min(...packStock.map(p => p.packsDisponibles));
      console.log('Stock final calculado:', availablePackStock);

      return res.json([{
        Material: Material,
        MaterialName: `Pack ${Material}`,
        werks: werks,
        lgort: lgort,
        stock_disp: availablePackStock.toString(),
        is_pack: true,
        debug_info: {
          components: packStock.map(p => ({
            sku: p.sku,
            stock_disponible: p.stockDisponible,
            quantity_per_pack: p.quantityPerPack,
            packs_posibles: p.packsDisponibles
          }))
        }
      }]);
    }

    return res.json(stockData);

  } catch (error) {
    console.error('Error al obtener stock:', error);
    return res.status(500).json({ error: 'Error al obtener el stock' });
  }
};