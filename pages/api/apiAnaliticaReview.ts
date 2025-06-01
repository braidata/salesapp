import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

// ===== INTERFACES =====
interface VTEXOrderSummary {
  orderId: string;
  sequence: number;
  status: string;
  statusDescription: string;
  value?: number;
  totalValue?: number;
  creationDate: string;
  lastChange?: string;
  isCompleted: boolean;
}

interface MissingOrderAnalysis {
  orderId: string;
  status: string;
  statusDescription: string;
  creationDate: string;
  value: number;
  ageInDays: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface DataComparatorResponse {
  success: boolean;
  error?: string;
  summary: {
    dateRange: {
      from: string;
      to: string;
      daysAnalyzed: number;
    };
    vtexApiTotal: number;
    databaseTotal: number;
    missingInDatabase: number;
    completenessRate: number;
  };
  missingOrders: MissingOrderAnalysis[];
  dailyBreakdown: Array<{
    date: string;
    vtexCount: number;
    dbCount: number;
    missingCount: number;
    completenessRate: number;
  }>;
  // Simple array ready for batchOrderProcessor
  missingOrderIds: string[];
  metadata: {
    processingTime: number;
    apiCalls: number;
    averageResponseTime: number;
  };
}

// ===== CONFIGURATION =====
const RATE_LIMIT = {
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 30 // More generous for comparator
};

const API_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  requestTimeout: 30000,
  maxDaysRange: 60, // Allow longer ranges for analysis
  delayBetweenDates: 200 // 200ms between date checks
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

function generateDateRange(dateFrom: string, dateTo: string): string[] {
  const dates: string[] = [];
  const start = new Date(dateFrom);
  const end = new Date(dateTo);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }
  
  return dates;
}

function calculateAgeInDays(creationDate: string): number {
  const now = new Date();
  const created = new Date(creationDate);
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculatePriority(ageInDays: number, value: number, status: string): 'critical' | 'high' | 'medium' | 'low' {
  // Critical: Recent high-value orders or stuck in processing
  if ((ageInDays <= 2 && value > 50000) || ['handling', 'payment-approved'].includes(status)) {
    return 'critical';
  }
  
  // High: Recent orders or medium-value stuck orders
  if (ageInDays <= 7 || (value > 20000 && ageInDays <= 14)) {
    return 'high';
  }
  
  // Medium: Moderate age/value
  if (ageInDays <= 30 || value > 10000) {
    return 'medium';
  }
  
  return 'low';
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
      
      if (attempt < retries) {
        await delay(API_CONFIG.retryDelay * attempt);
      }
    }
  }
  
  throw lastError || new Error('All fetch attempts failed');
}

async function fetchVTEXOrdersForDate(date: string): Promise<VTEXOrderSummary[]> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/vtex-orders-list?${new URLSearchParams({
    startDate: date,
    endDate: date,
    page: '1',
    perPage: '500'
  })}`;

  console.log(`🔍 Fetching VTEX orders for ${date}`);

  const response = await fetchWithRetry(url, {
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await response.json();
  const orders = Array.isArray(data) ? data : (data.list || []);
  
  console.log(`📦 VTEX returned ${orders.length} orders for ${date}`);
  return orders;
}

// ===== MAIN COMPARISON LOGIC =====
async function compareDataCompleteness(dateFrom: string, dateTo: string): Promise<DataComparatorResponse> {
  const startTime = Date.now();
  let apiCalls = 0;
  const responseTimes: number[] = [];
  
  console.log(`🔍 Starting data comparison for ${dateFrom} to ${dateTo}`);
  
  const dateRange = generateDateRange(dateFrom, dateTo);
  const dailyBreakdown: Array<{
    date: string;
    vtexCount: number;
    dbCount: number;
    missingCount: number;
    completenessRate: number;
  }> = [];
  
  const allMissingOrders: MissingOrderAnalysis[] = [];
  let totalVtexOrders = 0;
  let totalDbOrders = 0;
  
  // Process each date
  for (const date of dateRange) {
    const dateStartTime = Date.now();
    
    // Get VTEX orders for this date
    const vtexOrders = await fetchVTEXOrdersForDate(date);
    apiCalls++;
    responseTimes.push(Date.now() - dateStartTime);
    
    // Get DB orders for this date
    const dbOrders = await prisma.vtex_orders.findMany({
      where: {
        creation_date: {
          gte: new Date(`${date}T00:00:00.000Z`),
          lt: new Date(`${date}T23:59:59.999Z`)
        }
      },
      select: { vtex_order_id: true }
    });
    
    const dbOrderIds = new Set(dbOrders.map(o => o.vtex_order_id));
    
    // Find missing orders (excluding canceled orders)
    const missingOrders = vtexOrders.filter(vtexOrder => 
      !dbOrderIds.has(vtexOrder.orderId) &&
      !['canceled', 'cancelled', 'cancel'].includes(vtexOrder.status.toLowerCase())
    );
    
    // Analyze missing orders
    for (const missingOrder of missingOrders) {
      const orderValue = missingOrder.value || missingOrder.totalValue || 0;
      const ageInDays = calculateAgeInDays(missingOrder.creationDate);
      
      allMissingOrders.push({
        orderId: missingOrder.orderId,
        status: missingOrder.status,
        statusDescription: missingOrder.statusDescription,
        creationDate: missingOrder.creationDate,
        value: orderValue ? orderValue / 100 : 0, // Convert from cents
        ageInDays,
        priority: calculatePriority(ageInDays, orderValue, missingOrder.status)
      });
    }
    
    // Calculate daily metrics (excluding canceled orders from VTEX count)
    const activeVtexOrders = vtexOrders.filter(order => 
      !['canceled', 'cancelled', 'cancel'].includes(order.status.toLowerCase())
    );
    const completenessRate = activeVtexOrders.length > 0 ? 
      ((activeVtexOrders.length - missingOrders.length) / activeVtexOrders.length) * 100 : 100;
    
    dailyBreakdown.push({
      date,
      vtexCount: activeVtexOrders.length, // Only active orders
      dbCount: dbOrders.length,
      missingCount: missingOrders.length,
      completenessRate: Math.round(completenessRate * 100) / 100
    });
    
    totalVtexOrders += activeVtexOrders.length; // Only count active orders
    totalDbOrders += dbOrders.length;
    
    console.log(`📊 ${date}: VTEX=${activeVtexOrders.length} (${vtexOrders.length} total, excluding canceled), DB=${dbOrders.length}, Missing=${missingOrders.length} (${completenessRate.toFixed(1)}%)`);
    
    // Delay between dates to be gentle with API
    if (date !== dateRange[dateRange.length - 1]) {
      await delay(API_CONFIG.delayBetweenDates);
    }
  }
  
  // Sort missing orders by priority and date
  allMissingOrders.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // If same priority, sort by creation date (newest first)
    return new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime();
  });
  
  const totalProcessingTime = Date.now() - startTime;
  const averageResponseTime = responseTimes.length > 0 ? 
    responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
  
  const overallCompletenessRate = totalVtexOrders > 0 ? 
    ((totalVtexOrders - allMissingOrders.length) / totalVtexOrders) * 100 : 100;
  
  // Extract just the order IDs for easy copy-paste to batchOrderProcessor
  const missingOrderIds = allMissingOrders.map(order => order.orderId);
  
  console.log(`✅ Comparison completed in ${totalProcessingTime}ms`);
  console.log(`📊 Summary: ${allMissingOrders.length}/${totalVtexOrders} active orders missing (${overallCompletenessRate.toFixed(2)}% complete)`);
  console.log(`📋 Missing order IDs ready for batch processing: [${missingOrderIds.slice(0, 3).join(', ')}${missingOrderIds.length > 3 ? '...' : ''}]`);
  console.log(`🚫 Canceled orders excluded from analysis`);
  
  return {
    success: true,
    summary: {
      dateRange: {
        from: dateFrom,
        to: dateTo,
        daysAnalyzed: dateRange.length
      },
      vtexApiTotal: totalVtexOrders,
      databaseTotal: totalDbOrders,
      missingInDatabase: allMissingOrders.length,
      completenessRate: Math.round(overallCompletenessRate * 100) / 100
    },
    missingOrders: allMissingOrders,
    dailyBreakdown,
    missingOrderIds,
    metadata: {
      processingTime: totalProcessingTime,
      apiCalls,
      averageResponseTime: Math.round(averageResponseTime)
    }
  };
}

// ===== API HANDLER =====
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DataComparatorResponse>
) {
  const startTime = Date.now();
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET.',
      summary: {} as any,
      missingOrders: [],
      dailyBreakdown: [],
      missingOrderIds: [],
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
      missingOrders: [],
      dailyBreakdown: [],
      missingOrderIds: [],
      metadata: {} as any
    });
  }

  try {
    const { dateFrom, dateTo } = req.query as { dateFrom?: string; dateTo?: string };

    // Validate required parameters
    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: dateFrom and dateTo',
        summary: {} as any,
        missingOrders: [],
        dailyBreakdown: [],
        missingOrderIds: [],
        metadata: {} as any
      });
    }

    // Validate date formats
    if (!validateDateFormat(dateFrom) || !validateDateFormat(dateTo)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
        summary: {} as any,
        missingOrders: [],
        dailyBreakdown: [],
        missingOrderIds: [],
        metadata: {} as any
      });
    }

    // Validate date range
    const validation = validateDateRange(dateFrom, dateTo);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error || 'Invalid date range',
        summary: {} as any,
        missingOrders: [],
        dailyBreakdown: [],
        missingOrderIds: [],
        metadata: {} as any
      });
    }

    console.log(`🔍 Data Comparator API request: ${dateFrom} to ${dateTo} (${validation.days} days) from ${clientIp}`);

    // Perform comparison
    const result = await compareDataCompleteness(dateFrom, dateTo);
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ Data Comparator API response sent in ${responseTime}ms`);
    
    // Update response time in metadata
    result.metadata.processingTime = responseTime;
    
    res.status(200).json(result);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Data Comparator API Error after ${responseTime}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      summary: {
        dateRange: { from: '', to: '', daysAnalyzed: 0 },
        vtexApiTotal: 0,
        databaseTotal: 0,
        missingInDatabase: 0,
        completenessRate: 0
      },
      missingOrders: [],
      dailyBreakdown: [],
      missingOrderIds: [],
      metadata: {
        processingTime: responseTime,
        apiCalls: 0,
        averageResponseTime: 0
      }
    });
  } finally {
    // Always disconnect Prisma
    await prisma.$disconnect();
  }
}

