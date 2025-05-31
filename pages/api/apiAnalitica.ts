import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

// ===== TYPES & INTERFACES =====
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

interface VTEXOrderSummary {
  orderId: string;
  sequence: number;
  status: string;
  statusDescription: string;
  value?: number;
  totalValue?: number;
  totals?: any;
  creationDate: string;
  lastChange?: string;
  authorizedDate?: string;
  invoicedDate?: string;
  isCompleted: boolean;
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

interface APIResponse {
  success: boolean;
  error?: string;
  metadata?: {
    processingTime: number;
    dataPoints: {
      vtex: {
        total: number;
        valid: number;
        processed: number;
        detailsFetched: number;
      };
      sap: {
        total: number;
        matched: number;
      };
    };
    processingSteps: {
      vtexFetch: number;
      vtexDetailsFetch: number;
      sapFetch: number;
      databaseSave: number;
      totalTime: number;
      vtexSuccess: boolean;
      sapSuccess: boolean;
      dbSuccess: boolean;
    };
    dateRange: {
      from: string;
      to: string;
      daysProcessed: number;
    };
  };
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// ===== CONFIGURATION =====
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20 // Very conservative for SAP
};

const API_CONFIG = {
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds base delay
  sapDelay: 2000, // 2 seconds between SAP calls
  vtexDetailDelay: 500, // 500ms between VTEX detail calls
  dbDelay: 500, // 500ms between DB operations
  maxDaysRange: 30,
  requestTimeout: 45000 // 45 seconds for SAP
};

// ===== GLOBAL VARIABLES =====
const rateLimitMap = new Map<string, RateLimitEntry>();
const prisma = new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// ===== RATE LIMITING =====
// Cleanup expired rate limit entries
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

// ===== UTILITY FUNCTIONS =====
function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? 
    (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) :
    req.socket.remoteAddress || 'unknown';
  return ip.trim();
}

function validateDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}

function validateDateRange(dateFrom: string, dateTo: string): { valid: boolean; error?: string; days?: number } {
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 0) {
    return { valid: false, error: 'Start date must be before end date' };
  }
  
  if (daysDiff > API_CONFIG.maxDaysRange) {
    return { valid: false, error: `Date range cannot exceed ${API_CONFIG.maxDaysRange} days` };
  }
  
  return { valid: true, days: daysDiff };
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== FETCH FUNCTIONS =====
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
      console.warn(`Fetch attempt ${attempt}/${retries} failed:`, lastError.message);
      
      if (attempt < retries) {
        await delay(API_CONFIG.retryDelay * attempt);
      }
    }
  }
  
  throw lastError || new Error('All fetch attempts failed');
}

async function fetchVTEXOrdersList(dateFrom: string, dateTo: string): Promise<VTEXOrderSummary[]> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/vtex-orders-list?${new URLSearchParams({
    startDate: dateFrom,
    endDate: dateTo,
    page: '1',
    perPage: '500'
  })}`;

  console.log('🔗 Fetching VTEX orders list from:', url);

  const response = await fetchWithRetry(url, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  
  // Handle both response formats
  const orders = Array.isArray(data) ? data : (data.list || []);
  
  console.log(`📦 VTEX orders list returned ${orders.length} orders`);
  return orders;
}

async function fetchVTEXOrderDetails(orderId: string): Promise<VTEXOrderComplete | null> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/vtex-order?${new URLSearchParams({
    orderId
  })}`;

  try {
    const response = await fetchWithRetry(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log(`📦 VTEX order details fetched for ${orderId}`);
    return data;
    
  } catch (error) {
    console.error(`❌ Failed to fetch VTEX order details for ${orderId}:`, error);
    return null;
  }
}

async function fetchVTEXOrdersWithDetails(orderIds: string[]): Promise<VTEXOrderComplete[]> {
  if (orderIds.length === 0) return [];

  console.log(`📦 Fetching detailed data for ${orderIds.length} VTEX orders SEQUENTIALLY`);
  const completeOrders: VTEXOrderComplete[] = [];

  // Process orders ONE BY ONE to be gentle with VTEX API
  for (let i = 0; i < orderIds.length; i++) {
    const orderId = orderIds[i];
    console.log(`📦 Fetching details ${i + 1}/${orderIds.length}: ${orderId}`);

    const orderDetails = await fetchVTEXOrderDetails(orderId);
    
    if (orderDetails) {
      completeOrders.push(orderDetails);
      console.log(`✅ VTEX order ${orderId}: Details fetched successfully`);
    } else {
      console.log(`⚠️ VTEX order ${orderId}: Failed to fetch details`);
    }

    // Delay between calls to be gentle with VTEX API
    if (i < orderIds.length - 1) {
      await delay(API_CONFIG.vtexDetailDelay);
    }
  }

  console.log(`📦 VTEX details fetch completed: ${completeOrders.length}/${orderIds.length} successful`);
  return completeOrders;
}

async function fetchSAPOrders(orderIds: string[], dateFrom: string, dateTo: string): Promise<SAPOrder[]> {
  if (orderIds.length === 0) return [];

  const sapApiUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const sapOrders: SAPOrder[] = [];

  console.log(`🏢 Fetching SAP data for ${orderIds.length} orders SEQUENTIALLY (one by one)`);

  // Process orders ONE BY ONE with delays to be SAP-friendly
  for (let i = 0; i < orderIds.length; i++) {
    const orderId = orderIds[i];
    let retryCount = 0;
    let success = false;

    console.log(`🏢 Processing SAP order ${i + 1}/${orderIds.length}: ${orderId}`);

    while (retryCount < API_CONFIG.maxRetries && !success) {
      try {
        const url = `${sapApiUrl}/api/apiSAPSalesEcommerce?${new URLSearchParams({
          purchaseOrder: orderId, // ONE order at a time
          dateFrom,
          dateTo,
          limit: '1'
        })}`;

        const response = await fetchWithRetry(url, {}, 1); // No internal retries, we handle them here
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          sapOrders.push(...result.data);
          console.log(`✅ SAP order ${orderId}: Found ${result.data.length} records`);
        } else {
          console.log(`ℹ️ SAP order ${orderId}: No data found`);
        }
        
        success = true;
        
      } catch (error) {
        retryCount++;
        console.error(`❌ SAP order ${orderId} attempt ${retryCount}/${API_CONFIG.maxRetries} failed:`, error);
        
        if (retryCount < API_CONFIG.maxRetries) {
          const backoffDelay = API_CONFIG.retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff
          console.log(`⏳ Waiting ${backoffDelay}ms before retry...`);
          await delay(backoffDelay);
        } else {
          console.error(`💥 SAP order ${orderId} failed after ${API_CONFIG.maxRetries} attempts, skipping...`);
        }
      }
    }

    // Always wait between SAP calls to be gentle with their API
    if (i < orderIds.length - 1) {
      console.log(`⏳ Waiting ${API_CONFIG.sapDelay}ms before next SAP call...`);
      await delay(API_CONFIG.sapDelay);
    }
  }

  console.log(`🏢 SAP processing completed: ${sapOrders.length} total orders retrieved`);
  return sapOrders;
}

// ===== DATA PROCESSING FUNCTIONS =====
async function processVTEXData(orders: VTEXOrderComplete[]): Promise<void> {
  if (!orders.length) return;

  console.log(`📦 Processing ${orders.length} VTEX orders in small batches...`);

  // Process in small batches with delays
  const batchSize = 3; // Small batches to be gentle
  for (let i = 0; i < orders.length; i += batchSize) {
    const batch = orders.slice(i, i + batchSize);
    const batchNum = Math.ceil((i + 1) / batchSize);
    const totalBatches = Math.ceil(orders.length / batchSize);
    
    console.log(`📦 Processing VTEX batch ${batchNum}/${totalBatches} (${batch.length} orders)`);

    await prisma.$transaction(async (tx) => {
      for (const order of batch) {
        // Debug order structure
        console.log(`🔍 Processing order ${order.orderId}:`, {
          orderId: order.orderId,
          hasValue: !!order.value,
          hasTotalValue: !!order.totalValue,
          hasTotals: !!order.totals,
          hasItems: !!order.items?.length,
          itemsCount: order.items?.length || 0,
          hasPaymentData: !!order.paymentData?.transactions?.length,
          transactionsCount: order.paymentData?.transactions?.length || 0
        });

        // Flexible value detection
        const orderValue = order.value || order.totalValue || (order.totals?.total) || 0;
        
        // Upsert main order
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

        console.log(`💾 Saved order ${order.orderId} with value: ${orderValue}`);

        // Clean existing related data
        await Promise.all([
          tx.vtex_order_items.deleteMany({ where: { vtex_order_id: savedOrder.id } }),
          tx.vtex_order_payments.deleteMany({ where: { vtex_order_id: savedOrder.id } })
        ]);

        // Insert items with flexible price detection
        if (order.items?.length) {
          console.log(`💾 Processing ${order.items.length} items for order ${order.orderId}`);
          
          // Debug first item structure
          console.log(`🔍 First item structure:`, {
            keys: Object.keys(order.items[0]),
            sample: {
              name: order.items[0].name,
              price: order.items[0].price,
              sellingPrice: order.items[0].sellingPrice,
              listPrice: order.items[0].listPrice,
              quantity: order.items[0].quantity
            }
          });
          
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
          console.log(`✅ Saved ${itemsData.length} items for order ${order.orderId}`);
        } else {
          console.log(`ℹ️ No items found for order ${order.orderId}`);
        }

        // Insert payments with better structure detection
        if (order.paymentData?.transactions?.length) {
          console.log(`💾 Processing payments for order ${order.orderId}`);
          
          // Debug payment structure
          console.log(`🔍 Payment structure:`, {
            transactionsCount: order.paymentData.transactions.length,
            firstTransaction: order.paymentData.transactions[0] ? {
              keys: Object.keys(order.paymentData.transactions[0]),
              hasPayments: !!order.paymentData.transactions[0].payments,
              paymentsCount: order.paymentData.transactions[0].payments?.length || 0
            } : null
          });
          
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
            console.log(`✅ Saved ${paymentsData.length} payments for order ${order.orderId}`);
          } else {
            console.log(`⚠️ No valid payments found for order ${order.orderId}`);
          }
        } else {
          console.log(`ℹ️ No payment data found for order ${order.orderId}`);
        }
      }
    });

    console.log(`✅ VTEX batch ${batchNum}/${totalBatches} completed`);
    
    // Delay between batches
    if (i + batchSize < orders.length) {
      await delay(API_CONFIG.dbDelay);
    }
  }

  console.log(`✅ Successfully processed ${orders.length} VTEX orders`);
}

async function processSAPData(orders: SAPOrder[]): Promise<void> {
  if (!orders.length) return;

  console.log(`🏢 Processing ${orders.length} SAP orders SEQUENTIALLY...`);

  // Process orders one by one with delays to avoid DB saturation
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    
    try {
      console.log(`💾 Processing SAP order ${i + 1}/${orders.length}: ${order.purchaseOrder}`);

      // Simplified SAP logic - just use purchase_order as primary key
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

      console.log(`✅ SAP order ${order.purchaseOrder} processed successfully`);
      
      // Delay between DB operations to be gentle
      if (i < orders.length - 1) {
        await delay(API_CONFIG.dbDelay);
      }
      
    } catch (error) {
      console.error(`❌ Error processing SAP order ${order.purchaseOrder}:`, error);
      // Continue with next order instead of failing everything
      continue;
    }
  }

  console.log(`✅ Successfully processed ${orders.length} SAP orders`);
}

async function createAnalyticsSummary(dateFrom: string, dateTo: string): Promise<void> {
  console.log('📈 Creating analytics summary...');

  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);
  endDate.setHours(23, 59, 59, 999);

  const [vtexMetrics, sapMetrics] = await Promise.all([
    prisma.vtex_orders.aggregate({
      where: {
        creation_date: { gte: startDate, lte: endDate }
      },
      _count: { vtex_order_id: true },
      _sum: { total_value: true }
    }),
    prisma.sap_orders.aggregate({
      where: {
        creation_date: { gte: startDate, lte: endDate }
      },
      _count: { purchase_order: true },
      _sum: { total_amount: true }
    })
  ]);

  const summaryDate = new Date(dateTo);
  summaryDate.setHours(0, 0, 0, 0);

  const totalRevenue = (vtexMetrics._sum.total_value || 0) + (sapMetrics._sum.total_amount || 0);

  await prisma.analytics_summary.upsert({
    where: { date: summaryDate },
    update: {
      total_orders_vtex: vtexMetrics._count.vtex_order_id,
      total_revenue_vtex: vtexMetrics._sum.total_value || 0,
      total_orders_sap: sapMetrics._count.purchase_order,
      total_revenue_sap: sapMetrics._sum.total_amount || 0,
      daily_order_value: totalRevenue,
      cross_platform_rate: calculateCrossPlatformRate(
        vtexMetrics._count.vtex_order_id,
        sapMetrics._count.purchase_order
      )
    },
    create: {
      date: summaryDate,
      total_orders_vtex: vtexMetrics._count.vtex_order_id,
      total_revenue_vtex: vtexMetrics._sum.total_value || 0,
      total_orders_sap: sapMetrics._count.purchase_order,
      total_revenue_sap: sapMetrics._sum.total_amount || 0,
      daily_order_value: totalRevenue,
      cross_platform_rate: calculateCrossPlatformRate(
        vtexMetrics._count.vtex_order_id,
        sapMetrics._count.purchase_order
      )
    }
  });

  console.log('✅ Analytics summary created successfully');
}

function calculateCrossPlatformRate(vtexOrders: number, sapOrders: number): number {
  if (!vtexOrders || !sapOrders) return 0;
  return Number(((Math.min(vtexOrders, sapOrders) / Math.max(vtexOrders, sapOrders)) * 100).toFixed(2));
}

// ===== MAIN PROCESSING FUNCTION =====
async function fetchAnalyticsData(dateFrom: string, dateTo: string): Promise<APIResponse> {
  const startTime = Date.now();
  const timing = {
    vtexFetch: 0,
    vtexDetailsFetch: 0,
    sapFetch: 0,
    databaseSave: 0,
    totalTime: 0
  };

  console.log(`🚀 Starting analytics fetch for ${dateFrom} to ${dateTo}`);

  try {
    // 1. Fetch VTEX orders list (summary)
    const vtexStartTime = Date.now();
    const allVtexOrdersSummary = await fetchVTEXOrdersList(dateFrom, dateTo);
    timing.vtexFetch = Date.now() - vtexStartTime;

    // 2. Filter valid VTEX orders from summary
    const validVtexOrderIds = allVtexOrdersSummary
      .filter((order: VTEXOrderSummary) => 
        order.orderId && 
        order.creationDate &&
        ['handling', 'payment-approved', 'invoice', 'invoiced', 'ready-for-handling', 'payment-pending', 'authorize', 'shipped', 'delivered'].includes(order.status)
      )
      .map(order => order.orderId);

    console.log(`📦 Valid VTEX orders from summary: ${validVtexOrderIds.length}/${allVtexOrdersSummary.length}`);

    // 3. Fetch detailed VTEX orders (with items and payments)
    const vtexDetailsStartTime = Date.now();
    const completeVtexOrders = await fetchVTEXOrdersWithDetails(validVtexOrderIds);
    timing.vtexDetailsFetch = Date.now() - vtexDetailsStartTime;

    // 4. Fetch SAP data for valid VTEX orders
    const sapStartTime = Date.now();
    const sapOrders = await fetchSAPOrders(validVtexOrderIds, dateFrom, dateTo);
    timing.sapFetch = Date.now() - sapStartTime;

    // 5. Save data to database SEQUENTIALLY
    const dbStartTime = Date.now();
    console.log('💾 Starting sequential database operations...');

    // Process VTEX first (faster, more reliable)
    if (completeVtexOrders.length > 0) {
      await processVTEXData(completeVtexOrders);
      console.log('⏳ Waiting before SAP processing...');
      await delay(API_CONFIG.dbDelay);
    }

    // Process SAP orders one by one (slower, more delicate)
    if (sapOrders.length > 0) {
      await processSAPData(sapOrders);
      console.log('⏳ Waiting before analytics summary...');
      await delay(API_CONFIG.dbDelay);
    }

    // Create analytics summary
    await createAnalyticsSummary(dateFrom, dateTo);

    timing.databaseSave = Date.now() - dbStartTime;
    timing.totalTime = Date.now() - startTime;

    console.log(`✅ Processing completed in ${timing.totalTime}ms`);

    // 6. Return results with detailed metadata
    return {
      success: true,
      metadata: {
        processingTime: timing.totalTime,
        dataPoints: {
          vtex: {
            total: allVtexOrdersSummary.length,
            valid: validVtexOrderIds.length,
            processed: completeVtexOrders.length,
            detailsFetched: completeVtexOrders.length
          },
          sap: {
            total: sapOrders.length,
            matched: sapOrders.filter(so => 
              validVtexOrderIds.includes(so.purchaseOrder)
            ).length
          }
        },
        processingSteps: {
          ...timing,
          vtexSuccess: timing.vtexFetch > 0,
          sapSuccess: timing.sapFetch >= 0, // SAP can be 0 if no orders
          dbSuccess: timing.databaseSave > 0
        },
        dateRange: {
          from: dateFrom,
          to: dateTo,
          daysProcessed: Math.ceil(
            (new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 
            (1000 * 60 * 60 * 24)
          )
        }
      }
    };

  } catch (error) {
    console.error('❌ Analytics Processing Error:', error);
    throw new Error(
      error instanceof Error ? 
      `Analytics processing failed: ${error.message}` : 
      'Unknown error in analytics processing'
    );
  }
}

// ===== API HANDLER =====
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>
) {
  const startTime = Date.now();
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET.' 
    });
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.'
    });
  }

  try {
    const { dateFrom, dateTo } = req.query as { dateFrom?: string; dateTo?: string };

    // Validate required parameters
    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: dateFrom and dateTo'
      });
    }

    // Validate date formats
    if (!validateDateFormat(dateFrom) || !validateDateFormat(dateTo)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Validate date range
    const validation = validateDateRange(dateFrom, dateTo);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error || 'Invalid date range'
      });
    }

    console.log(`🚀 API request: ${dateFrom} to ${dateTo} (${validation.days} days) from ${clientIp}`);

    // Process analytics data
    const result = await fetchAnalyticsData(dateFrom, dateTo);
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ API response sent in ${responseTime}ms`);
    
    // Add response time to metadata
    if (result.metadata) {
      result.metadata.processingTime = responseTime;
    }
    
    res.status(200).json(result);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ API Error after ${responseTime}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      metadata: {
        processingTime: responseTime,
        dataPoints: {
          vtex: { total: 0, valid: 0, processed: 0, detailsFetched: 0 },
          sap: { total: 0, matched: 0 }
        },
        processingSteps: {
          vtexFetch: 0,
          vtexDetailsFetch: 0,
          sapFetch: 0,
          databaseSave: 0,
          totalTime: responseTime,
          vtexSuccess: false,
          sapSuccess: false,
          dbSuccess: false
        },
        dateRange: {
          from: req.query.dateFrom as string || '',
          to: req.query.dateTo as string || '',
          daysProcessed: 0
        }
      }
    });
  } finally {
    // Always disconnect Prisma
    await prisma.$disconnect();
  }
}