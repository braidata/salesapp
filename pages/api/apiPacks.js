import packs from '../../utils/packs.json';

export default function handler(req, res) {
  const { sku } = req.query;

  if (!sku) {
    return res.status(400).json({ error: 'Debe proporcionar un SKU de pack' });
  }

  if (!packs[sku]) {
    return res.status(404).json({ error: 'El SKU proporcionado no es un pack válido' });
  }

  const components = packs[sku].components.map(component => ({
    sku: component.sku,
    quantity: component.quantity
  }));

  return res.json({
    pack_sku: sku,
    components
  });
}
