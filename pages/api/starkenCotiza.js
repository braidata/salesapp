// pages/api/tarifas.ts

import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

export default async (req, res) => {
  try {
    // Valores predeterminados en el cuerpo de la solicitud
    const {
      codigoCiudadOrigen = 1,
      codigoCiudadDestino = 1,
      alto = 50,
      ancho = 70,
      largo = 80,
      kilos = 50,
      cuentaCorriente = '44651',
      cuentaCorrienteDV = '3',
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
      Cookie: 'serviciosdls=3204715692.56091.0000',
    };

    const response = await axios.post(
      'http://serviciosdls.starken.cl/StarkenServicesRest/webresources/rest/consultarTarifas',
      data,
      { headers }
    );

    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: 'An error occurred' });
  }
};
