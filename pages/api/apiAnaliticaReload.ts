import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

// ===== INTERFACES (From original apiAnalitica) =====
interface VTEXOrderComplete {
  orderId: string;
  sequence: number;
  status: string;
  statusDescription: string;
  value: number;
  totalValue?: number;
  totals?: any;
  creationDate: string;
  lastChange?: string;
  authorizedDate?: string;
  invoicedDate?: string;
  isCompleted: boolean;
  clientProfileData?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    document?: string;
    phone?: string;
    isCorporate?: boolean;
  };
  shippingData?: {
    address?: {
      city?: string;
      state?: string;
    };
    logisticsInfo?: Array<{
      deliveryCompany?: string;
    }>;
  };
  items?: Array<{
    uniqueId: string;
    productId: string;
    refId: string;
    name: string;
    quantity: number;
    price: number;
    sellingPrice: number;
    listPrice?: number;
    additionalInfo?: {
      brandName?: string;
    };
  }>;
  paymentData?: {
    transactions?: Array<{
      payments?: Array<{
        paymentSystemName: string;
        value: number;
        installments: number;
      }>;
    }>;
  };
}

interface SAPOrder {
  purchaseOrder: string;
  sapOrder: string;
  customer: string;
  creationDateFormatted: string;
  status: string;
  statusCode: string;
  totalAmount: number;
  documentType: string;
  documentTypeText: string;
  document: string;
  febosFC: string;
  items: Array<{
    sku: string;
    name: string;
    quantity: number;
    amount: number;
  }>;
}

interface OrderResult {
  orderId: string;
  vtexStatus: 'success' | 'failed' | 'not_found';
  sapStatus: 'success' | 'failed' | 'not_found';
  errorMessage?: string;
  processingTime: number;
}

interface BatchProcessorResponse {
  success: boolean;
  error?: string;
  results: {
    totalOrdersRequested: number;
    vtexOrdersProcessed: number;
    sapOrdersMatched: number;
    successfullyProcessed: number;
    orderResults: OrderResult[];
  };
  metadata: {
    totalProcessingTime: number;
    vtexApiCalls: number;
    sapApiCalls: number;
    databaseOperations: number;
    averageOrderProcessingTime: number;
    efficiency: {
      vtexSuccessRate: number;
      sapSuccessRate: number;
      overallSuccessRate: number;
    };
  };
}

// ===== CONFIGURATION (Based on original) =====
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 15 // Conservative for batch processing
};

const API_CONFIG = {
  maxRetries: 3,
  retryDelay: 2000,
  sapDelay: 2000, // 2 seconds between SAP calls
  vtexDetailDelay: 500, // 500ms between VTEX detail calls
  dbDelay: 500, // 500ms between DB operations
  requestTimeout: 45000, // 45 seconds for SAP
  maxOrdersPerBatch: 50 // Limit batch size
};

// ===== GLOBAL VARIABLES =====
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const prisma = new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// ===== UTILITY FUNCTIONS (From original) =====
function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? 
    (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) :
    req.socket.remoteAddress || 'unknown';
  return ip.trim();
}

function validateOrderIds(orderIds: string[]): { valid: boolean; error?: string } {
  if (!Array.isArray(orderIds)) {
    return { valid: false, error: 'orderIds must be an array' };
  }

  if (orderIds.length === 0) {
    return { valid: false, error: 'orderIds array cannot be empty' };
  }

  if (orderIds.length > API_CONFIG.maxOrdersPerBatch) {
    return { valid: false, error: `Maximum ${API_CONFIG.maxOrdersPerBatch} orders per batch` };
  }

  // Validate each order ID format (basic validation)
  for (const orderId of orderIds) {
    if (typeof orderId !== 'string' || orderId.trim().length === 0) {
      return { valid: false, error: 'All order IDs must be non-empty strings' };
    }
  }

  return { valid: true };
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== RATE LIMITING (From original) =====
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, RATE_LIMIT.windowMs);

function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientIp);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(clientIp, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs
    });
    return false;
  }

  if (entry.count >= RATE_LIMIT.maxRequests) {
    return true;
  }

  entry.count++;
  return false;
}

// ===== FETCH FUNCTIONS (From original apiAnalitica) =====
async function fetchWithRetry(
  url: string, 
  options: RequestInit = {}, 
  retries: number = API_CONFIG.maxRetries
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.requestTimeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown fetch error');
      
      if (attempt < retries) {
        await delay(API_CONFIG.retryDelay * attempt);
      }
    }
  }
  
  throw lastError || new Error('All fetch attempts failed');
}

async function fetchVTEXOrderDetails(orderId: string): Promise<VTEXOrderComplete | null> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/vtex-order?${new URLSearchParams({
    orderId
  })}`;

  try {
    console.log(`📦 Fetching VTEX details for: ${orderId}`);
    const response = await fetchWithRetry(url, {
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();
    console.log(`✅ VTEX order details fetched for ${orderId}`);
    return data;
    
  } catch (error) {
    console.error(`❌ Failed to fetch VTEX order details for ${orderId}:`, error);
    return null;
  }
}

async function fetchSAPOrderDetails(orderId: string): Promise<SAPOrder | null> {
  const sapApiUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  try {
    console.log(`🏢 Fetching SAP details for: ${orderId}`);
    
    // Use a wide date range to ensure we find the order
    const today = new Date();
    const sixMonthsAgo = new Date(today.getTime() - (180 * 24 * 60 * 60 * 1000));
    
    const url = `${sapApiUrl}/api/apiSAPSalesEcommerce?${new URLSearchParams({
      purchaseOrder: orderId,
      dateFrom: sixMonthsAgo.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
      limit: '1'
    })}`;

    const response = await fetchWithRetry(url, {}, 1);
    const result = await response.json();
    
    if (result.success && result.data && result.data.length > 0) {
      console.log(`✅ SAP order found for ${orderId}`);
      return result.data[0];
    } else {
      console.log(`ℹ️ SAP order not found for ${orderId}`);
      return null;
    }
    
  } catch (error) {
    console.error(`❌ Failed to fetch SAP order for ${orderId}:`, error);
    return null;
  }
}

// ===== PROCESSING FUNCTIONS (From original apiAnalitica) =====
async function processVTEXData(orders: VTEXOrderComplete[]): Promise<void> {
  if (!orders.length) return;

  console.log(`💾 Processing ${orders.length} VTEX orders...`);

  // Process in small batches with delays (from original)
  const batchSize = 3;
  for (let i = 0; i < orders.length; i += batchSize) {
    const batch = orders.slice(i, i + batchSize);
    
    await prisma.$transaction(async (tx) => {
      for (const order of batch) {
        const orderValue = order.value || order.totalValue || (order.totals?.total) || 0;
        
        // Upsert main order (exact logic from original)
        const savedOrder = await tx.vtex_orders.upsert({
          where: { vtex_order_id: order.orderId },
          update: {
            sequence: order.sequence,
            status: order.status,
            status_description: order.statusDescription,
            total_value: orderValue ? orderValue / 100 : 0,
            creation_date: new Date(order.creationDate),
            last_change: order.lastChange ? new Date(order.lastChange) : null,
            authorized_date: order.authorizedDate ? new Date(order.authorizedDate) : null,
            invoiced_date: order.invoicedDate ? new Date(order.invoicedDate) : null,
            is_completed: order.isCompleted || false,
            customer_email: order.clientProfileData?.email,
            customer_first_name: order.clientProfileData?.firstName,
            customer_last_name: order.clientProfileData?.lastName,
            customer_document: order.clientProfileData?.document,
            customer_phone: order.clientProfileData?.phone,
            customer_is_corporate: order.clientProfileData?.isCorporate || false,
            shipping_city: order.shippingData?.address?.city,
            shipping_state: order.shippingData?.address?.state,
            delivery_company: order.shippingData?.logisticsInfo?.[0]?.deliveryCompany,
            raw_vtex_data: order
          },
          create: {
            vtex_order_id: order.orderId,
            sequence: order.sequence,
            status: order.status,
            status_description: order.statusDescription,
            total_value: orderValue ? orderValue / 100 : 0,
            creation_date: new Date(order.creationDate),
            last_change: order.lastChange ? new Date(order.lastChange) : null,
            authorized_date: order.authorizedDate ? new Date(order.authorizedDate) : null,
            invoiced_date: order.invoicedDate ? new Date(order.invoicedDate) : null,
            is_completed: order.isCompleted || false,
            customer_email: order.clientProfileData?.email,
            customer_first_name: order.clientProfileData?.firstName,
            customer_last_name: order.clientProfileData?.lastName,
            customer_document: order.clientProfileData?.document,
            customer_phone: order.clientProfileData?.phone,
            customer_is_corporate: order.clientProfileData?.isCorporate || false,
            shipping_city: order.shippingData?.address?.city,
            shipping_state: order.shippingData?.address?.state,
            delivery_company: order.shippingData?.logisticsInfo?.[0]?.deliveryCompany,
            raw_vtex_data: order
          }
        });

        // Clean existing related data
        await Promise.all([
          tx.vtex_order_items.deleteMany({ where: { vtex_order_id: savedOrder.id } }),
          tx.vtex_order_payments.deleteMany({ where: { vtex_order_id: savedOrder.id } })
        ]);

        // Insert items with flexible price detection
        if (order.items?.length) {
          const itemsData = order.items.map(item => {
            const unitPrice = item.price || item.listPrice || 0;
            const sellingPrice = item.sellingPrice || item.price || item.listPrice || 0;
            
            return {
              vtex_order_id: savedOrder.id,
              vtex_unique_id: item.uniqueId,
              product_id: item.productId,
              ref_id: item.refId,
              product_name: item.name,
              brand_name: item.additionalInfo?.brandName,
              quantity: item.quantity,
              unit_price: unitPrice ? unitPrice / 100 : 0,
              selling_price: sellingPrice ? sellingPrice / 100 : 0
            };
          });

          await tx.vtex_order_items.createMany({ data: itemsData });
        }

        // Insert payments with better structure detection
        if (order.paymentData?.transactions?.length) {
          const paymentsData = order.paymentData.transactions
            .flatMap(transaction => transaction.payments || [])
            .map(payment => ({
              vtex_order_id: savedOrder.id,
              payment_system_name: payment.paymentSystemName,
              payment_value: payment.value ? payment.value / 100 : 0,
              installments: payment.installments
            }));

          if (paymentsData.length) {
            await tx.vtex_order_payments.createMany({ data: paymentsData });
          }
        }
      }
    });

    if (i + batchSize < orders.length) {
      await delay(API_CONFIG.dbDelay);
    }
  }

  console.log(`✅ Successfully processed ${orders.length} VTEX orders`);
}

async function processSAPData(orders: SAPOrder[]): Promise<void> {
  if (!orders.length) return;

  console.log(`🏢 Processing ${orders.length} SAP orders SEQUENTIALLY...`);

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    
    try {
      const savedOrder = await prisma.sap_orders.upsert({
        where: { purchase_order: order.purchaseOrder },
        update: {
          sap_order: order.sapOrder,
          customer_code: order.customer,
          creation_date: new Date(order.creationDateFormatted),
          status: order.status,
          status_code: order.statusCode,
          total_amount: order.totalAmount,
          document_type: order.documentType,
          document_type_text: order.documentTypeText,
          document_number: order.document,
          febos_fc: order.febosFC,
          raw_sap_data: order
        },
        create: {
          purchase_order: order.purchaseOrder,
          sap_order: order.sapOrder,
          customer_code: order.customer,
          creation_date: new Date(order.creationDateFormatted),
          status: order.status,
          status_code: order.statusCode,
          total_amount: order.totalAmount,
          document_type: order.documentType,
          document_type_text: order.documentTypeText,
          document_number: order.document,
          febos_fc: order.febosFC,
          raw_sap_data: order
        }
      });

      // Clean and insert items
      await prisma.sap_order_items.deleteMany({ 
        where: { sap_order_id: savedOrder.id } 
      });

      if (order.items?.length) {
        await prisma.sap_order_items.createMany({
          data: order.items.map(item => ({
            sap_order_id: savedOrder.id,
            sku: item.sku,
            product_name: item.name,
            quantity: item.quantity,
            amount: item.amount
          }))
        });
      }
      
      if (i < orders.length - 1) {
        await delay(API_CONFIG.dbDelay);
      }
      
    } catch (error) {
      console.error(`❌ Error processing SAP order ${order.purchaseOrder}:`, error);
      continue;
    }
  }

  console.log(`✅ Successfully processed ${orders.length} SAP orders`);
}

// ===== MAIN BATCH PROCESSING LOGIC =====
async function processBatchOfOrders(orderIds: string[]): Promise<BatchProcessorResponse> {
  const startTime = Date.now();
  let vtexApiCalls = 0;
  let sapApiCalls = 0;
  let databaseOperations = 0;
  
  console.log(`🚀 Starting batch processing for ${orderIds.length} orders`);
  
  const orderResults: OrderResult[] = [];
  const successfulVtexOrders: VTEXOrderComplete[] = [];
  const successfulSapOrders: SAPOrder[] = [];
  
  // Process each order individually with detailed tracking
  for (let i = 0; i < orderIds.length; i++) {
    const orderId = orderIds[i];
    const orderStartTime = Date.now();
    
    console.log(`📦 Processing order ${i + 1}/${orderIds.length}: ${orderId}`);
    
    let vtexStatus: 'success' | 'failed' | 'not_found' = 'not_found';
    let sapStatus: 'success' | 'failed' | 'not_found' = 'not_found';
    let errorMessage: string | undefined = undefined;
    
    // Fetch VTEX order details
    try {
      const vtexOrder = await fetchVTEXOrderDetails(orderId);
      vtexApiCalls++;
      
      if (vtexOrder) {
        successfulVtexOrders.push(vtexOrder);
        vtexStatus = 'success';
        console.log(`✅ VTEX order ${orderId}: Success`);
      } else {
        vtexStatus = 'not_found';
        console.log(`⚠️ VTEX order ${orderId}: Not found`);
      }
      
    } catch (error) {
      vtexStatus = 'failed';
      errorMessage = `VTEX fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.log(`❌ VTEX order ${orderId}: Failed - ${errorMessage}`);
    }
    
    // Delay between VTEX calls
    await delay(API_CONFIG.vtexDetailDelay);
    
    // Fetch SAP order details
    try {
      const sapOrder = await fetchSAPOrderDetails(orderId);
      sapApiCalls++;
      
      if (sapOrder) {
        successfulSapOrders.push(sapOrder);
        sapStatus = 'success';
        console.log(`✅ SAP order ${orderId}: Success`);
      } else {
        sapStatus = 'not_found';
        console.log(`ℹ️ SAP order ${orderId}: Not found`);
      }
      
    } catch (error) {
      sapStatus = 'failed';
      const sapError = `SAP fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errorMessage = errorMessage ? `${errorMessage}; ${sapError}` : sapError;
      console.log(`❌ SAP order ${orderId}: Failed - ${sapError}`);
    }
    
    // Delay between SAP calls
    await delay(API_CONFIG.sapDelay);
    
    const orderProcessingTime = Date.now() - orderStartTime;
    
    orderResults.push({
      orderId,
      vtexStatus,
      sapStatus,
      errorMessage,
      processingTime: orderProcessingTime
    });
    
    console.log(`⏱️ Order ${orderId} processed in ${orderProcessingTime}ms`);
  }
  
  // Save all successful data to database
  try {
    console.log(`💾 Saving ${successfulVtexOrders.length} VTEX orders to database...`);
    if (successfulVtexOrders.length > 0) {
      await processVTEXData(successfulVtexOrders);
      databaseOperations++;
    }
    
    console.log(`💾 Saving ${successfulSapOrders.length} SAP orders to database...`);
    if (successfulSapOrders.length > 0) {
      await processSAPData(successfulSapOrders);
      databaseOperations++;
    }
    
  } catch (error) {
    console.error(`❌ Database processing error:`, error);
    // Mark affected orders as failed in results
    const dbError = `Database save failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    orderResults.forEach(result => {
      if ((result.vtexStatus === 'success' || result.sapStatus === 'success') && !result.errorMessage) {
        result.errorMessage = dbError;
      }
    });
  }
  
  // Calculate metrics
  const totalProcessingTime = Date.now() - startTime;
  const averageOrderProcessingTime = orderResults.length > 0 ? 
    orderResults.reduce((sum, result) => sum + result.processingTime, 0) / orderResults.length : 0;
  
  const vtexSuccessCount = orderResults.filter(r => r.vtexStatus === 'success').length;
  const sapSuccessCount = orderResults.filter(r => r.sapStatus === 'success').length;
  const overallSuccessCount = orderResults.filter(r => 
    r.vtexStatus === 'success' && r.sapStatus === 'success'
  ).length;
  
  const vtexSuccessRate = orderIds.length > 0 ? (vtexSuccessCount / orderIds.length) * 100 : 0;
  const sapSuccessRate = orderIds.length > 0 ? (sapSuccessCount / orderIds.length) * 100 : 0;
  const overallSuccessRate = orderIds.length > 0 ? (overallSuccessCount / orderIds.length) * 100 : 0;
  
  console.log(`✅ Batch processing completed in ${totalProcessingTime}ms`);
  console.log(`📊 Success rates: VTEX=${vtexSuccessRate.toFixed(1)}%, SAP=${sapSuccessRate.toFixed(1)}%, Overall=${overallSuccessRate.toFixed(1)}%`);
  
  return {
    success: true,
    results: {
      totalOrdersRequested: orderIds.length,
      vtexOrdersProcessed: vtexSuccessCount,
      sapOrdersMatched: sapSuccessCount,
      successfullyProcessed: overallSuccessCount,
      orderResults
    },
    metadata: {
      totalProcessingTime,
      vtexApiCalls,
      sapApiCalls,
      databaseOperations,
      averageOrderProcessingTime: Math.round(averageOrderProcessingTime),
      efficiency: {
        vtexSuccessRate: Math.round(vtexSuccessRate * 100) / 100,
        sapSuccessRate: Math.round(sapSuccessRate * 100) / 100,
        overallSuccessRate: Math.round(overallSuccessRate * 100) / 100
      }
    }
  };
}

// ===== API HANDLER =====
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BatchProcessorResponse>
) {
  const startTime = Date.now();
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.',
      results: {} as any,
      metadata: {} as any
    });
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      results: {} as any,
      metadata: {} as any
    });
  }

  try {
    const { orderIds } = req.body as { orderIds?: string[] };

    // Validate required parameters
    if (!orderIds) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: orderIds (array of order IDs)',
        results: {} as any,
        metadata: {} as any
      });
    }

    // Validate order IDs
    const validation = validateOrderIds(orderIds);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error || 'Invalid order IDs',
        results: {} as any,
        metadata: {} as any
      });
    }

    console.log(`🚀 Batch Processor API request: ${orderIds.length} orders from ${clientIp}`);
    console.log(`📋 Order IDs: ${orderIds.slice(0, 5).join(', ')}${orderIds.length > 5 ? '...' : ''}`);

    // Process batch of orders
    const result = await processBatchOfOrders(orderIds);
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ Batch Processor API response sent in ${responseTime}ms`);
    
    // Update response time in metadata
    result.metadata.totalProcessingTime = responseTime;
    
    res.status(200).json(result);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Batch Processor API Error after ${responseTime}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      results: {
        totalOrdersRequested: 0,
        vtexOrdersProcessed: 0,
        sapOrdersMatched: 0,
        successfullyProcessed: 0,
        orderResults: []
      },
      metadata: {
        totalProcessingTime: responseTime,
        vtexApiCalls: 0,
        sapApiCalls: 0,
        databaseOperations: 0,
        averageOrderProcessingTime: 0,
        efficiency: {
          vtexSuccessRate: 0,
          sapSuccessRate: 0,
          overallSuccessRate: 0
        }
      }
    });
  } finally {
    // Always disconnect Prisma
    await prisma.$disconnect();
  }
}

