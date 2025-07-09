import axios from 'axios';

export default async (req, res) => {
  const VBELN = req.query.VBELN || '';
  const REFCLIENTE = req.query.REFCLIENTE || '';

  // Credenciales SAP de producción
  const SAP_USER = process.env.SAP_USER;
  const SAP_PASSWORD = process.env.SAP_PASSWORD;

  // el array de "pedidos" sólo para VBELN; si no hay VBELN, lo dejamos vacío
  const pedidos = VBELN 
    ? VBELN.split(',').map(p => p.trim()) 
    : [''];

  // construimos la URL (ajusta el puerto si estás en QA)
  const SAP_URL = 'https://sapwdp.imega.cl:44330/RESTAdapter/EstatusPedido_Sender';

  try {
    const statusPromises = pedidos.map(pedido => {
      // body dinámico: sólo incluyo VBELN si no está vacío
      const body = {
        ...(pedido && { VBELN: pedido }),
        ...(REFCLIENTE && { REFCLIENTE })
      };

      return axios.post(SAP_URL, body, {
        auth: { username: SAP_USER, password: SAP_PASSWORD }
      });
    });

    const responses = await Promise.all(statusPromises);
    const statusData = responses.map(r => r.data);

    return res.json(statusData.length === 1 ? statusData[0] : statusData);

  } catch (error) {
    console.error('Error al obtener estatus del pedido:', error);
    if (error.response) {
      const { status, data } = error.response;
      return res.status(status).json({
        error: 'Error al consultar estatus del pedido',
        details: data,
        status
      });
    }
    return res.status(500).json({ error: 'Error al obtener el estatus del pedido' });
  }
};
