import fetch from 'node-fetch';

export default async function handler(req, res) {
  const  id  = req.body.id ? req.body.id : req.query.id;

  const empresa = process.env.EMPRESAF;
  const token = process.env.TOKENF;

  const url = `https://api.febos.cl/produccion/documentos/${id}?imagen=si&tipoImagen=3&regenerar=no&incrustar=no&xmlFirmado=si`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      empresa,
      token,
    },
  });

  const data = await response.json();

  res.status(response.status).json(data);
}