import axios from 'axios';

export default async (req, res) => {
  try {
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://serviciosdls.starken.cl/StarkenServicesRest/webresources/rest/listarCiudadesOrigen',
      headers: { 
        'Rut': '77261280', 
        'Clave': 'key', 
        'Cookie': 'serviciosdls=1308955820.54811.0000'
      }
    };

    const response = await axios.request(config);
    res.status(200).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: 'An error occurred' });
  }
};

