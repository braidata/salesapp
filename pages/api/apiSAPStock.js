import axios from 'axios';

export default async (req, res) => {
  const { Material, werks, lgort, chunkSize = 500 } = req.query; // El cliente puede especificar el tamaño del chunk o utilizar un valor predeterminado

  const SAP_USER = process.env.SAP_USER;
  const SAP_PASSWORD = process.env.SAP_PASSWORD;

  const buildFilterPart = (param, paramName) => {
    if (!param) return '';
    const values = param.split(',');
    const filterParts = values.map(value => `${paramName} eq '${value.trim()}'`);
    return filterParts.length > 1 ? `(${filterParts.join(' or ')})` : filterParts[0];
  };

  // recuerda revisar el nombre de las variables del cubo 

  const materialFilter = buildFilterPart(Material, 'Material');
  const werksFilter = buildFilterPart(werks, 'werks');
  const lgortFilter = buildFilterPart(lgort, 'lgort');

  const filters = [materialFilter, werksFilter, lgortFilter].filter(Boolean).join(' and ');

  let allData = [];

  let hasMoreData = true;

  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 2000; // Puedes ajustar el tamaño de la página
  let skip = (page - 1) * pageSize;

  // Continúa haciendo solicitudes hasta que no haya más datos
  while (hasMoreData) {
    // Solo obtén y devuelve una página de resultados a la vez


    const SAP_URL = `http://4.227.212.162:8001/sap/opu/odata/sap/ZCDS_CUBE_INVENTARIO_CDS/ZCDS_CUBE_INVENTARIO?$filter=${filters}&$select=Material,MaterialName,werks,lgort,labst,stock_disp,stock_Comp&$top=${pageSize}&$skip=${skip}`;


    try {
      const response = await axios.get(SAP_URL, {
        auth: {
          username: SAP_USER,
          password: SAP_PASSWORD,
        },
      });

      const chunkData = response.data.d.results;
      allData = allData.concat(chunkData);

      // Comprueba si todavía hay más datos por cargar
      hasMoreData = chunkData.length === chunkSize;
      skip += chunkSize;

    } catch (error) {
      // Manejar errores, por ejemplo, parar el bucle y registrar el error
      hasMoreData = false;
      console.error('Error al recuperar datos del servicio SAP', error);
      break;
    }
  }

  return res.json(allData);
};


