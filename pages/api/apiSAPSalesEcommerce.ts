import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  amount: number;
}

interface ProcessedOrder {
  purchaseOrder: string;
  sapOrder: string;
  creationDate: string;
  customer: string;
  deliveryStatus: string;
  billingStatus: string;
  status: string;
  statusCode: string;
  totalAmount: number;
  items: OrderItem[];
}

interface SAPResponse {
  d: {
    results: Array<{
      PurchaseOrderByCustomer: string;
      SalesOrder: string;
      CreationDate: string;
      SoldToParty: string;
      DeliveryStatus: string;
      BillingStatus: string;
      NetAmount: number;
      SDPROCESSSTATUS_TEXT: string;
      SDPROCESSSTATUS: string;
      Material: string;
      MaterialDescription: string;
      Quantity: number;
      [key: string]: any;
    }>;
  };
}

interface ErrorResponse {
  error: string;
  details?: string;
}

async function fetchSAPEcommerceSales(
  purchaseOrder?: string, 
  dateFrom?: string, 
  dateTo?: string,
  limit: number = 100
) {
  const SAP_USER = process.env.SAP_USER;
  const SAP_PASSWORD = process.env.SAP_PASSWORD;
  const BASE_URL = 'https://sapwdp.imega.cl:44300/sap/opu/odata/sap/ZCDS_CUBE_PEDIDOS_CDS/ZCDS_CUBE_PEDIDOS';

  let filters = [];
  
  if (purchaseOrder) {
    filters.push(`PurchaseOrderByCustomer eq '${purchaseOrder}'`);
  }
  
  if (dateFrom) {
    filters.push(`CreationDate ge datetime'${dateFrom}T00:00:00'`);
  }
  
  if (dateTo) {
    filters.push(`CreationDate le datetime'${dateTo}T23:59:59'`);
  }

  if (filters.length === 0) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const formattedDate = sevenDaysAgo.toISOString().split('T')[0];
    filters.push(`CreationDate ge datetime'${formattedDate}T00:00:00'`);
  }

  const queryParams = [
    `$filter=${filters.join(' and ')}`,
    '$orderby=CreationDate desc',
    `$top=${limit}`,
    '$format=json'
  ].join('&');

  const SAP_URL = `${BASE_URL}?${queryParams}`;

  try {
    const response = await axios.get<SAPResponse>(SAP_URL, {
      auth: {
        username: SAP_USER,
        password: SAP_PASSWORD
      },
      headers: {
        'Accept': 'application/json'
      }
    });

    const orderMap = response.data.d.results.reduce((acc, order) => {
      const orderKey = order.PurchaseOrderByCustomer;
      
      if (!acc.has(orderKey)) {
        acc.set(orderKey, {
          purchaseOrder: order.PurchaseOrderByCustomer,
          sapOrder: order.SalesOrder,
          creationDateFormatted: new Date(parseInt(order.CreationDate.match(/\d+/)[0])).toISOString().split('T')[0],
          customer: order.SoldToParty,
          deliveryStatus: order.DeliveryStatus,
          billingStatus: order.BillingStatus,
          status: order.SDPROCESSSTATUS_TEXT,
          statusCode: order.SDPROCESSSTATUS,
          totalAmount: 0,
          febosFC: order.febosFC || '',
          documentType: order.blart || '',
          documentTypeText: order.BLART_TEXT,
          document: order.DocumentReferenceID,
          items: []
        });
      }

      const currentOrder = acc.get(orderKey);
      currentOrder.items.push({
        sku: order.Material,
        name: order.SalesOrderItemText,
        quantity: parseFloat(order.ORDERQUANTITY),
        amount: order.NetAmount || 0
      });

      currentOrder.totalAmount += parseFloat(order.NetAmount) || 0;

      return acc;
    }, new Map<string, ProcessedOrder>());

    const orders = Array.from(orderMap.values());

    return {
      success: true,
      data: orders,
    //   metadata: {
    //     count: orders.length,
    //     totalOrders: orders.length,
    //     totalItems: orders.reduce((acc, order) => acc + order.items.length, 0),
    //     totalAmount: orders.reduce((acc, order) => acc + order.totalAmount, 0),
    //     limit,
    //     filters: {
    //       purchaseOrder,
    //       dateFrom,
    //       dateTo
    //     },
    //     queryUrl: SAP_URL
    //   }
    };

  } catch (error) {
    console.error('SAP API Error:', error);
    throw new Error(error instanceof Error ? error.message : 'Unknown error in SAP request');
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      purchaseOrder, 
      dateFrom, 
      dateTo,
      limit: limitParam 
    } = req.query as { 
      purchaseOrder?: string; 
      dateFrom?: string; 
      dateTo?: string;
      limit?: string;
    };

    if (purchaseOrder && !/^[A-Za-z0-9-]+$/.test(purchaseOrder)) {
      return res.status(400).json({
        error: 'Invalid purchase order format'
      });
    }

    if ((dateFrom && !/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) || 
        (dateTo && !/^\d{4}-\d{2}-\d{2}$/.test(dateTo))) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 100;
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      return res.status(400).json({
        error: 'Invalid limit. Must be between 1 and 1000'
      });
    }

    const data = await fetchSAPEcommerceSales(
      purchaseOrder,
      dateFrom,
      dateTo,
      limit
    );

    res.status(200).json(data);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Error fetching SAP data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}