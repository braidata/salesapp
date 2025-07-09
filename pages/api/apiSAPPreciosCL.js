import axios from 'axios';
import packs from '../../utils/packs.json';

export default async (req, res) => {
  const { Material, ORGVT = "IM01", CANAL = "18", KUNNR } = req.query;

  // Credenciales SAP para precios
  const SAP_USER = process.env.SAP_USER;
  const SAP_PASSWORD = process.env.SAP_PASSWORD;

  try {
    let materialsToCheck = [Material];
    
    if (packs[Material]) {
      const components = packs[Material].components;
      const componentSkus = components.map(c => c.sku);
      materialsToCheck = [...materialsToCheck, ...componentSkus];
    }

    const pricePromises = materialsToCheck.map(material => 
      axios.post('https://sapwdp.imega.cl:44330/RESTAdapter/Consulta_Precios_Sender', 
        {
          ORGVT,
          CANAL,
          MATERIAL: material,
          KUNNR
        },
        {
          auth: {
            username: SAP_USER,
            password: SAP_PASSWORD
          }
        }
      )
    );

    const responses = await Promise.all(pricePromises);
    const priceData = responses.map(response => response.data);

    if (packs[Material]) {
      // Calcular precio del pack sumando componentes
      const packPrice = packs[Material].components.reduce((total, component) => {
        const componentPrice = priceData.find(p => p.MATERIAL === component.sku.toString());
        const unitPrice = componentPrice ? parseFloat(componentPrice.PRECIO || 0) : 0;
        return total + (unitPrice * component.quantity);
      }, 0);

      return res.json([{
        MATERIAL: Material,
        PRECIO: packPrice.toString(),
        ORGVT,
        CANAL,
        KUNNR,
        is_pack: true,
        components: packs[Material].components.map(c => ({
          sku: c.sku,
          quantity: c.quantity,
          unit_price: priceData.find(p => p.MATERIAL === c.sku.toString())?.PRECIO || 0
        }))
      }]);
    }

    return res.json(priceData);

  } catch (error) {
    console.error('Error al obtener precios:', error);
    return res.status(500).json({ error: 'Error al obtener los precios' });
  }
};