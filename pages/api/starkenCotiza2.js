// pages/api/tarifas.ts

import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

export default async (req, res) => {
  try {
    // Valores predeterminados en el cuerpo de la solicitud
    const {
      codigoCiudadOrigen = 1,
      codigoCiudadDestino = 1,
      alto = 88,
      ancho = 88,
      largo = 88,
      kilos = 163,
      cuentaCorriente = '776220',
      cuentaCorrienteDV = '8',
      rutCliente = '',
    } = req.body;

    // Query parameters (opcional)
    const { Rut = '77261280', Clave = 'key' } = req.query;

    const data = {
      codigoCiudadOrigen,
      codigoCiudadDestino,
      alto,
      ancho,
      largo,
      kilos,
      cuentaCorriente,
      cuentaCorrienteDV,
      rutCliente,
    };

    const headers = {
      Rut,
      Clave,
      'Content-Type': 'application/json',
      Cookie: 'serviciosdls=1308955820.54811.0000',
    };

    const response = await axios.post(
        'https://serviciosdls.starken.cl/StarkenServicesRest/webresources/rest/consultarCobertura',
      data,
      { headers }
    );

    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: 'An error occurred' });
  }
};
