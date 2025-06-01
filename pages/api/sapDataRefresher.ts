import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

// ===== INTERFACES =====
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

interface VTEXOrderForSAPCheck {
  id: number;
  vtex_order_id: string;
  creation_date: Date;
  status: string;
  total_value: number;
  sap_order?: {
    id: number;
    status: string;
    status_code: string;
    total_amount: number;
    updated_at: Date;
  } | null;
}

interface SAPRefreshResult {
  orderId: string;
  action: 'created' | 'updated' | 'no_change' | 'not_found' | 'failed';
  changes?: {
    status?: { from: string; to: string };
    statusCode?: { from: string; to: string };
    totalAmount?: { from: number; to: number };
  };
  error?: string;
  processingTime: number;
}

interface SAPDataRefresherResponse {
  success: boolean;
  error?: string;
  summary: {
    checkTime: string;
    dateRange: {
      from: string;
      to: string;
    };
    analysis: {
      totalVTEXOrders: number;
      ordersWithoutSAP: number;
      ordersWithOutdatedSAP: number;
      ordersToProcess: number;
      excludedCompleted: number;
    };
    processing: {
      sapApiCalls: number;
      ordersCreated: number;
      ordersUpdated: number;
      ordersNoChange: number;
      ordersFailed: number;
      processingTime: number;
    };
  };
  orderResults: SAPRefreshResult[];
  metadata: {
    totalExecutionTime: number;
    nextRefreshRecommended: string;
    sapSyncHealth: 'excellent' | 'good' | 'attention' | 'critical';
  };
}

// ===== CONFIGURATION =====
const RATE_LIMIT = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 500 // Conservative for SAP calls
};

const SAP_REFRESH_CONFIG = {
  maxRetries: 3,
  retryDelay: 2000,
  sapDelay: 2000, // 2 seconds between SAP calls
  requestTimeout: 45000, // 45 seconds for SAP
  recentDaysToCheck: 7, // Check last 7 days by default
  maxOrdersPerBatch: 30, // Safety limit for SAP calls
  outdatedThresholdHours: 6, // Consider SAP data outdated after 6 hours
  excludedSAPStatuses: ['C'], // Exclude completed orders
  excludedVTEXStatuses: ['canceled', 'cancelled', 'cancel'] // Exclude canceled VTEX orders
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

// ===== UTILITY FUNCTIONS =====
function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? 
    (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) :
    req.socket.remoteAddress || 'unknown';
  return ip.trim();
}

function generateDateRange(daysBack: number = SAP_REFRESH_CONFIG.recentDaysToCheck): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const daysAgo = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
  
  return {
    dateFrom: daysAgo.toISOString().split('T')[0],
    dateTo: now.toISOString().split('T')[0]
  };
}

function isDataOutdated(lastUpdate: Date): boolean {
  const now = new Date();
  const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
  return hoursSinceUpdate > SAP_REFRESH_CONFIG.outdatedThresholdHours;
}

function detectChanges(current: any, incoming: SAPOrder): any {
  const changes: any = {};
  
  if (current.status !== incoming.status) {
    changes.status = { from: current.status, to: incoming.status };
  }
  
  if (current.status_code !== incoming.statusCode) {
    changes.statusCode = { from: current.status_code, to: incoming.statusCode };
  }
  
  if (Math.abs(current.total_amount - incoming.totalAmount) > 0.01) {
    changes.totalAmount = { from: current.total_amount, to: incoming.totalAmount };
  }
  
  return Object.keys(changes).length > 0 ? changes : null;
}

function calculateSAPSyncHealth(
  ordersCreated: number, 
  ordersUpdated: number, 
  ordersFailed: number, 
  totalProcessed: number
): 'excellent' | 'good' | 'attention' | 'critical' {
  if (totalProcessed === 0) return 'excellent';
  
  const failureRate = ordersFailed / totalProcessed;
  const changeRate = (ordersCreated + ordersUpdated) / totalProcessed;
  
  if (failureRate === 0 && changeRate < 0.1) return 'excellent';
  if (failureRate < 0.05 && changeRate < 0.3) return 'good';
  if (failureRate < 0.15 && changeRate < 0.5) return 'attention';
  return 'critical';
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== RATE LIMITING =====
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

// ===== SAP API FUNCTIONS =====
async function fetchWithRetry(
  url: string, 
  options: RequestInit = {}, 
  retries: number = SAP_REFRESH_CONFIG.maxRetries
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SAP_REFRESH_CONFIG.requestTimeout);
      
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
        await delay(SAP_REFRESH_CONFIG.retryDelay * attempt);
      }
    }
  }
  
  throw lastError || new Error('All fetch attempts failed');
}

async function fetchSAPOrder(orderId: string, dateFrom: string, dateTo: string): Promise<SAPOrder | null> {
  const sapApiUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  try {
    console.log(`🏢 Fetching SAP data for: ${orderId}`);
    
    const url = `${sapApiUrl}/api/apiSAPSalesEcommerce?${new URLSearchParams({
      purchaseOrder: orderId,
      dateFrom,
      dateTo,
      limit: '1'
    })}`;

    const response = await fetchWithRetry(url, {}, 1);
    const result = await response.json();
    
    if (result.success && result.data && result.data.length > 0) {
      console.log(`✅ SAP data found for ${orderId}: status ${result.data[0].statusCode}`);
      return result.data[0];
    } else {
      console.log(`ℹ️ No SAP data found for ${orderId}`);
      return null;
    }
    
  } catch (error) {
    console.error(`❌ Failed to fetch SAP data for ${orderId}:`, error);
    throw error;
  }
}

// ===== DATABASE OPERATIONS =====
async function getOrdersNeedingSAPRefresh(dateFrom: string, dateTo: string): Promise<VTEXOrderForSAPCheck[]> {
  // Get VTEX orders first
  const vtexOrders = await prisma.vtex_orders.findMany({
    where: {
      creation_date: {
        gte: new Date(`${dateFrom}T00:00:00.000Z`),
        lte: new Date(`${dateTo}T23:59:59.999Z`)
      },
      status: {
        notIn: SAP_REFRESH_CONFIG.excludedVTEXStatuses
      }
    },
    orderBy: {
      creation_date: 'desc'
    }
  });

  // Get corresponding SAP orders (manual join)
  const vtexOrderIds = vtexOrders.map(o => o.vtex_order_id);
  const sapOrders = await prisma.sap_orders.findMany({
    where: {
      purchase_order: {
        in: vtexOrderIds
      }
    },
    select: {
      id: true,
      purchase_order: true,
      status: true,
      status_code: true,
      total_amount: true,
      updated_at: true
    }
  });

  // Create a map for quick lookup
  const sapOrdersMap = new Map(
    sapOrders.map(sap => [sap.purchase_order, sap])
  );

  // Combine VTEX orders with their SAP data and filter
  const ordersWithSAP = vtexOrders.map(order => ({
    id: order.id,
    vtex_order_id: order.vtex_order_id,
    creation_date: order.creation_date,
    status: order.status,
    total_value: order.total_value,
    sap_order: sapOrdersMap.get(order.vtex_order_id) || null
  }));

  // Filter orders that need SAP refresh
  return ordersWithSAP.filter(order => {
    const sapOrder = order.sap_order;
    
    // Case 1: No SAP data at all
    if (!sapOrder) {
      return true;
    }
    
    // Case 2: SAP order is completed - exclude
    if (SAP_REFRESH_CONFIG.excludedSAPStatuses.includes(sapOrder.status_code)) {
      return false;
    }
    
    // Case 3: SAP data is outdated
    if (sapOrder.updated_at && isDataOutdated(sapOrder.updated_at)) {
      return true;
    }
    
    return false;
  });
}

async function createSAPOrder(sapData: SAPOrder): Promise<void> {
  const savedOrder = await prisma.sap_orders.create({
    data: {
      purchase_order: sapData.purchaseOrder,
      sap_order: sapData.sapOrder,
      customer_code: sapData.customer,
      creation_date: new Date(sapData.creationDateFormatted),
      status: sapData.status,
      status_code: sapData.statusCode,
      total_amount: sapData.totalAmount,
      document_type: sapData.documentType,
      document_type_text: sapData.documentTypeText,
      document_number: sapData.document,
      febos_fc: sapData.febosFC,
      raw_sap_data: sapData,
      updated_at: new Date()
    }
  });

  // Add items
  if (sapData.items?.length) {
    await prisma.sap_order_items.createMany({
      data: sapData.items.map(item => ({
        sap_order_id: savedOrder.id,
        sku: item.sku,
        product_name: item.name,
        quantity: item.quantity,
        amount: item.amount
      }))
    });
  }
}

async function updateSAPOrder(sapOrderId: number, sapData: SAPOrder): Promise<void> {
  await prisma.sap_orders.update({
    where: { id: sapOrderId },
    data: {
      status: sapData.status,
      status_code: sapData.statusCode,
      total_amount: sapData.totalAmount,
      document_type: sapData.documentType,
      document_type_text: sapData.documentTypeText,
      document_number: sapData.document,
      febos_fc: sapData.febosFC,
      raw_sap_data: sapData,
      updated_at: new Date()
    }
  });

  // Update items
  await prisma.sap_order_items.deleteMany({
    where: { sap_order_id: sapOrderId }
  });

  if (sapData.items?.length) {
    await prisma.sap_order_items.createMany({
      data: sapData.items.map(item => ({
        sap_order_id: sapOrderId,
        sku: item.sku,
        product_name: item.name,
        quantity: item.quantity,
        amount: item.amount
      }))
    });
  }
}

// ===== MAIN SAP REFRESH LOGIC =====
async function performSAPDataRefresh(dateFrom?: string, dateTo?: string): Promise<SAPDataRefresherResponse> {
  const startTime = Date.now();
  const checkTime = new Date().toISOString();
  
  // Use provided dates or default to recent days
  const dateRange = dateFrom && dateTo ? { dateFrom, dateTo } : generateDateRange();
  
  console.log(`🏢 Starting SAP data refresh for ${dateRange.dateFrom} to ${dateRange.dateTo}`);
  
  try {
    // Step 1: Analyze what needs refreshing
    console.log(`📊 Step 1: Analyzing orders needing SAP refresh...`);
    const ordersToCheck = await getOrdersNeedingSAPRefresh(dateRange.dateFrom, dateRange.dateTo);
    
    const ordersWithoutSAP = ordersToCheck.filter(o => !o.sap_order).length;
    const ordersWithOutdatedSAP = ordersToCheck.filter(o => o.sap_order).length;
    const excludedCompleted = await prisma.sap_orders.count({
      where: {
        status_code: { in: SAP_REFRESH_CONFIG.excludedSAPStatuses },
        creation_date: {
          gte: new Date(`${dateRange.dateFrom}T00:00:00.000Z`),
          lte: new Date(`${dateRange.dateTo}T23:59:59.999Z`)
        }
      }
    });
    
    console.log(`📊 Analysis: ${ordersWithoutSAP} without SAP, ${ordersWithOutdatedSAP} outdated, ${excludedCompleted} excluded (completed)`);
    
    // Step 2: Process orders (respecting limits)
    const ordersToProcess = ordersToCheck.slice(0, SAP_REFRESH_CONFIG.maxOrdersPerBatch);
    const orderResults: SAPRefreshResult[] = [];
    let sapApiCalls = 0;
    let ordersCreated = 0;
    let ordersUpdated = 0;
    let ordersNoChange = 0;
    let ordersFailed = 0;
    
    console.log(`🔄 Step 2: Processing ${ordersToProcess.length} orders...`);
    
    for (let i = 0; i < ordersToProcess.length; i++) {
      const order = ordersToProcess[i];
      const orderStartTime = Date.now();
      
      console.log(`🏢 Processing ${i + 1}/${ordersToProcess.length}: ${order.vtex_order_id}`);
      
      try {
        // Fetch current SAP data
        const sapData = await fetchSAPOrder(
          order.vtex_order_id, 
          dateRange.dateFrom, 
          dateRange.dateTo
        );
        sapApiCalls++;
        
        const processingTime = Date.now() - orderStartTime;
        
        if (!sapData) {
          // No SAP data found
          orderResults.push({
            orderId: order.vtex_order_id,
            action: 'not_found',
            processingTime
          });
          console.log(`ℹ️ ${order.vtex_order_id}: No SAP data found`);
          
        } else if (!order.sap_order) {
          // Create new SAP record
          await createSAPOrder(sapData);
          ordersCreated++;
          orderResults.push({
            orderId: order.vtex_order_id,
            action: 'created',
            processingTime
          });
          console.log(`✅ ${order.vtex_order_id}: Created SAP record with status ${sapData.statusCode}`);
          
        } else {
          // Check for changes and update if needed
          const changes = detectChanges(order.sap_order, sapData);
          
          if (changes) {
            await updateSAPOrder(order.sap_order.id, sapData);
            ordersUpdated++;
            orderResults.push({
              orderId: order.vtex_order_id,
              action: 'updated',
              changes,
              processingTime
            });
            console.log(`🔄 ${order.vtex_order_id}: Updated SAP data`, changes);
          } else {
            ordersNoChange++;
            orderResults.push({
              orderId: order.vtex_order_id,
              action: 'no_change',
              processingTime
            });
            console.log(`✓ ${order.vtex_order_id}: No changes needed`);
          }
        }
        
      } catch (error) {
        ordersFailed++;
        const processingTime = Date.now() - orderStartTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        orderResults.push({
          orderId: order.vtex_order_id,
          action: 'failed',
          error: errorMessage,
          processingTime
        });
        console.error(`❌ ${order.vtex_order_id}: Failed - ${errorMessage}`);
      }
      
      // Delay between SAP calls
      if (i < ordersToProcess.length - 1) {
        await delay(SAP_REFRESH_CONFIG.sapDelay);
      }
    }
    
    const totalExecutionTime = Date.now() - startTime;
    const sapSyncHealth = calculateSAPSyncHealth(ordersCreated, ordersUpdated, ordersFailed, ordersToProcess.length);
    
    console.log(`✅ SAP refresh completed in ${totalExecutionTime}ms`);
    console.log(`📊 Results: ${ordersCreated} created, ${ordersUpdated} updated, ${ordersNoChange} unchanged, ${ordersFailed} failed`);
    console.log(`🏥 SAP sync health: ${sapSyncHealth}`);
    
    return {
      success: true,
      summary: {
        checkTime,
        dateRange,
        analysis: {
          totalVTEXOrders: ordersToCheck.length,
          ordersWithoutSAP,
          ordersWithOutdatedSAP,
          ordersToProcess: ordersToProcess.length,
          excludedCompleted
        },
        processing: {
          sapApiCalls,
          ordersCreated,
          ordersUpdated,
          ordersNoChange,
          ordersFailed,
          processingTime: totalExecutionTime
        }
      },
      orderResults,
      metadata: {
        totalExecutionTime,
        nextRefreshRecommended: new Date(Date.now() + (6 * 60 * 60 * 1000)).toISOString(), // 6 hours from now
        sapSyncHealth
      }
    };
    
  } catch (error) {
    console.error(`❌ SAP refresh error:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown SAP refresh error',
      summary: {
        checkTime,
        dateRange,
        analysis: {
          totalVTEXOrders: 0,
          ordersWithoutSAP: 0,
          ordersWithOutdatedSAP: 0,
          ordersToProcess: 0,
          excludedCompleted: 0
        },
        processing: {
          sapApiCalls: 0,
          ordersCreated: 0,
          ordersUpdated: 0,
          ordersNoChange: 0,
          ordersFailed: 0,
          processingTime: 0
        }
      },
      orderResults: [],
      metadata: {
        totalExecutionTime: Date.now() - startTime,
        nextRefreshRecommended: new Date(Date.now() + (6 * 60 * 60 * 1000)).toISOString(),
        sapSyncHealth: 'critical'
      }
    };
  }
}

// ===== API HANDLER =====
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SAPDataRefresherResponse>
) {
  const startTime = Date.now();
  
  // Allow both GET and POST requests
  if (!['GET', 'POST'].includes(req.method || '')) {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET or POST.',
      summary: {} as any,
      orderResults: [],
      metadata: {} as any
    });
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      summary: {} as any,
      orderResults: [],
      metadata: {} as any
    });
  }

  try {
    const { dateFrom, dateTo } = req.query as { dateFrom?: string; dateTo?: string };

    console.log(`🏢 SAP Data Refresher API request from ${clientIp}`);
    if (dateFrom && dateTo) {
      console.log(`📅 Custom date range: ${dateFrom} to ${dateTo}`);
    }

    // Perform SAP data refresh
    const result = await performSAPDataRefresh(dateFrom, dateTo);
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ SAP Data Refresher API response sent in ${responseTime}ms`);
    
    // Update response time in metadata
    result.metadata.totalExecutionTime = responseTime;
    
    res.status(200).json(result);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ SAP Data Refresher API Error after ${responseTime}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      summary: {
        checkTime: new Date().toISOString(),
        dateRange: { from: '', to: '' },
        analysis: {
          totalVTEXOrders: 0,
          ordersWithoutSAP: 0,
          ordersWithOutdatedSAP: 0,
          ordersToProcess: 0,
          excludedCompleted: 0
        },
        processing: {
          sapApiCalls: 0,
          ordersCreated: 0,
          ordersUpdated: 0,
          ordersNoChange: 0,
          ordersFailed: 0,
          processingTime: 0
        }
      },
      orderResults: [],
      metadata: {
        totalExecutionTime: responseTime,
        nextRefreshRecommended: new Date(Date.now() + (6 * 60 * 60 * 1000)).toISOString(),
        sapSyncHealth: 'critical'
      }
    });
  } finally {
    // Always disconnect Prisma
    await prisma.$disconnect();
  }
}
