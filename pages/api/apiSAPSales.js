// api/getSAPDetails.js

import axios from 'axios';

// Función separada para obtener los datos de ventas de SAP
async function fetchSAPSalesDetails(salesOrder, salesOrderItem) {
  const SAP_USER = process.env.SAP_USER;
  const SAP_PASSWORD = process.env.SAP_PASSWORD;
  // Asegúrate de actualizar la URL a la entidad correcta y parámetros para ventas
  const SAP_URL = `http://20.83.154.218:8102/sap/opu/odata/sap/ZCDS_CUBO_VENTAS_CDS/ZCDS_CUBO_VENTAS(SalesOrder='${salesOrder}',SalesOrderItem='${salesOrderItem}')`;

  const response = await axios.get(SAP_URL, {
    auth: {
      username: SAP_USER,
      password: SAP_PASSWORD
    }
  });

  // Ajusta los campos en función de la respuesta de tu servicio OData de ventas
  return {
    salesOrder: response.data.d.SalesOrder,
    salesOrderItem: response.data.d.SalesOrderItem,
    billingDocument: response.data.d.BillingDocument,
    billingDocumentItem: response.data.d.BillingDocumentItem,
    creditNote: response.data.d.creditnote,
    creditNoteItem: response.data.d.creditnoteitem,
    deliveryDocument: response.data.d.deliverydocument,
    deliveryDocumentItem: response.data.d.deliverydocumentitem,
    deliveryDate: response.data.d.deliverydate,
    creationDate: response.data.d.CreationDate,
    createdByUser: response.data.d.CreatedByUser,
    creationTime: response.data.d.CreationTime,
    billingDocumentDate: response.data.d.BillingDocumentDate,
    billingDocumentType: response.data.d.BillingDocumentType,
    soldToParty: response.data.d.SoldToParty,
    soldToPartyName: response.data.d.SoldToPartyName,
    shipToParty: response.data.d.ShipToParty,
    shipToPartyName: response.data.d.ShipToPartyName,
    payerParty: response.data.d.PayerParty,
    payerPartyName: response.data.d.PayerPartyName,
    billToParty: response.data.d.BillToParty,
    billToPartyName: response.data.d.BillToPartyName,
    salesGroup: response.data.d.SalesGroup,
    salesGroupText: response.data.d.SALESGROUP_TEXT,
    purchaseOrderByCustomer: response.data.d.PurchaseOrderByCustomer,
    customerPaymentTerms: response.data.d.CustomerPaymentTerms,
    customerPaymentTerms_TEXT: response.data.d.CustomerPaymentTerms_TEXT,
    material: response.data.d.Material,
    materialDescription: response.data.d.mtbez,
    orderQuantity: response.data.d.OrderQuantity,
    orderQuantityUnit: response.data.d.OrderQuantityUnit,
    netPriceAmount: response.data.d.NetPriceAmount,
    netAmount: response.data.d.NetAmount,
    taxAmount: response.data.d.TaxAmount,
    totalAmount: response.data.d.TOTAL,
    currency: response.data.d.TransactionCurrency,
    plant: response.data.d.Plant,
    storageLocation: response.data.d.StorageLocation,
    distributionChannel: response.data.d.DistributionChannel,
    distributionChannelText: response.data.d.DistributionChannel_TXT,
    customer: response.data.d.Customer,
    customerName: response.data.d.NAME_VENDOR,
    salesOrderItemCategory: response.data.d.SalesOrderItemCategory,
    salesOrderItemCategoryText: response.data.d.SALESORDERITEMCATEGORY_text,
    salesOrderType: response.data.d.SalesOrderType,
    salesOrderTypeText: response.data.d.SalesOrderType_text,
    priceDeterminationExchangeRate: response.data.d.PriceDetnExchangeRate1,
    additionalMaterialGroup1: response.data.d.AdditionalMaterialGroup1,
    additionalMaterialGroup1Text: response.data.d.AdditionalMaterialGroup1_TEXT,
    productType: response.data.d.PRODUCTTYPE,
    productTypeDescription: response.data.d.vtext,
    salesOrderItemText: response.data.d.SalesOrderItemText,
    billingQuantity: response.data.d.BillingQuantity,
    billingQuantityUnit: response.data.d.BillingQuantityUnit,
    netAmountOfBillingDocument: response.data.d.ItemNetAmountOfBillingDoc,
    taxAmount: response.data.d.TaxAmount,
    total: response.data.d.TOTAL,
    transactionCurrency: response.data.d.TransactionCurrency,
    companyCodeCurrencyCost: response.data.d.COSTO_UNI,
    amountInCompanyCodeCurrency: response.data.d.AMOUNTINCOMPANYCODECURRENCY,
    displayCurrency: response.data.d.DisplayCurrency,
    netAmountInDisplayCurrency: response.data.d.NetAmountInDisplayCurrency,
    plant: response.data.d.Plant,
    productionPlantName: response.data.d.ProductionPlantName,
    storageLocation: response.data.d.StorageLocation,
    storageLocationName: response.data.d.StorageLocationName,
    profitCenter: response.data.d.ProfitCenter,
    profitCenterText: response.data.d.ProfitCenter_TEXT,
    itemGrossWeight: response.data.d.ItemGrossWeight,
    itemNetWeight: response.data.d.ItemNetWeight,
    itemWeightUnit: response.data.d.ItemWeightUnit,
    itemVolume: response.data.d.ItemVolume,
    itemVolumeUnit: response.data.d.ItemVolumeUnit,
    city1: response.data.d.city1,
    city2: response.data.d.city2,
    route: response.data.d.Route,
    routeText: response.data.d.route_txt,
    entrega: response.data.d.ENTREGA,
    pricingSchema: response.data.d.kalsm,
    pricingSchemaText: response.data.d.kalsm_txt,
    paymentControl: response.data.d.ctlpc,
    cmgst: response.data.d.cmgst,
    cmgstText: response.data.d.CMGST_txt,
    sdProcessStatus: response.data.d.SDProcessStatus,
    sdProcessStatusText: response.data.d.SDProcessStatus_TEXT,
    itemIsBillingRelevant: response.data.d.ItemIsBillingRelevant,
    itemIsBillingRelevantText: response.data.d.ITEMISBILLINGRELEVANT_TEXT,
    amount: response.data.d.amount,
    creditLimit: response.data.d.credit_limit,
    accountingDocument: response.data.d.AccountingDocument,
    fiscalYear: response.data.d.FiscalYear,
    postingDate: response.data.d.PostingDate,
    accountingDocumentMovement: response.data.d.ACCDOC_MOV,
    documentNumberMovement: response.data.d.NRODOC_MOV,
    accountingDocumentCreditNote: response.data.d.ACCDOC_NC,
    documentNumberCreditNote: response.data.d.NRODOC_NC,
    // ...otros campos que quieras retornar
  };
}

// API Endpoint
const getSAPSalesData = async (req, res) => {
  try {
    // Asegúrate de que los parámetros que esperas son pasados correctamente a la función
    const { salesOrder, salesOrderItem } = req.query;
    const data = await fetchSAPSalesDetails(salesOrder, salesOrderItem);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default getSAPSalesData;

