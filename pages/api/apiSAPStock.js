import axios from 'axios';

export default async (req, res) => {
  const { Material, werks, lgort } = req.query;

  const SAP_USER = process.env.SAP_USER;
  const SAP_PASSWORD = process.env.SAP_PASSWORD;

  const SAP_URL = `http://20.83.154.218:8102/sap/opu/odata/sap/ZCDS_CUBE_INVENTARIO_CDS/ZCDS_CUBE_INVENTARIO(Material='${Material}',werks='${werks}',lgort='${lgort}')`;

  try {
    const response = await axios.get(SAP_URL, {
      auth: {
        username: SAP_USER,
        password: SAP_PASSWORD
      },
    });

    const data = response.data.d;

    const result = {
      Material: data.Material,
      werks: data.werks,
      lgort: data.lgort,
      prdha: data.prdha,
      nameprdha: data.nameprdha,
      lgpbe: data.lgpbe,
      MaterialName: data.MaterialName,
      marcatext: data.marcatext,
      PlantName: data.PlantName,
      StorageLocationName: data.StorageLocationName,
      prctr: data.prctr,
      ktext: data.ktext,
      ProductType: data.ProductType,
      mtbez: data.mtbez,
      STOCK_ENTREGA: data.STOCK_ENTREGA,
      STOCK_PEDIDO: data.STOCK_PEDIDO,
      MaterialBaseUnit: data.MaterialBaseUnit,
      MATLWRHSSTKQTYINMATLBASEUNIT: data.MATLWRHSSTKQTYINMATLBASEUNIT,
      MATLCNSMPNQTYINMATLBASEUNIT: data.MATLCNSMPNQTYINMATLBASEUNIT,
      MATLSTKINCRQTYINMATLBASEUNIT: data.MATLSTKINCRQTYINMATLBASEUNIT,
      MATLSTKDECRQTYINMATLBASEUNIT: data.MATLSTKDECRQTYINMATLBASEUNIT,
      labst: data.labst,
      sperr: data.sperr,
      umlme: data.umlme,
      insme: data.insme,
      einme: data.einme,
      speme: data.speme,
      retme: data.retme,
      WAERS: data.WAERS,
      verpr: data.verpr,
      BaseUnitSpecificProductLength: data.BaseUnitSpecificProductLength,
      BaseUnitSpecificProductWidth: data.BaseUnitSpecificProductWidth,
      BaseUnitSpecificProductHeight: data.BaseUnitSpecificProductHeight,
      ProductMeasurementUnit: data.ProductMeasurementUnit,
      stock_Comp: data.stock_Comp,
      stock_disp: data.stock_disp,
      PRICINGDATE: data.PRICINGDATE
    };

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

