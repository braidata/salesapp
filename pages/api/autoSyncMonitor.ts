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

interface AutoSyncResponse {
  success: boolean;
  error?: string;
  summary: {
    checkTime: string;
    dateRange: {
      from: string;
      to: string;
    };
    detection: {
      vtexApiTotal: number;
      databaseTotal: number;
      newOrdersFound: number;
      completenessRate: number;
    };
    processing: {
      ordersProcessed: number;
      vtexSuccess: number;
      sapSuccess: number;
      processingTime: number;
    };
  };
  newOrderIds: string[];
  processingResults?: any; // Results from apiAnaliticaReload if processing occurred
  metadata: {
    totalExecutionTime: number;
    nextCheckRecommended: string; // When to run next check
    systemHealth: 'excellent' | 'good' | 'attention' | 'critical';
  };
}

// ===== CONFIGURATION =====
const RATE_LIMIT = {
  windowMs: 2 * 60 * 1000, // 2 minutes (more frequent for auto-sync)
  maxRequests: 50 // Higher limit for automation
};

const AUTO_SYNC_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  requestTimeout: 60000, // 60 seconds for processing
  recentHoursToCheck: 24, // Check last 24 hours for new orders
  minOrdersToProcess: 1, // Process if at least 1 new order found
  maxOrdersPerBatch: 50 // Safety limit
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

function generateRecentDateRange(): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const hoursAgo = new Date(now.getTime() - (AUTO_SYNC_CONFIG.recentHoursToCheck * 60 * 60 * 1000));
  
  return {
    dateFrom: hoursAgo.toISOString().split('T')[0],
    dateTo: now.toISOString().split('T')[0]
  };
}

function calculateNextCheckTime(): string {
  const nextCheck = new Date(Date.now() + (5 * 60 * 1000)); // 5 minutes from now
  return nextCheck.toISOString();
}

function assessSystemHealth(completenessRate: number, newOrdersFound: number): 'excellent' | 'good' | 'attention' | 'critical' {
  if (completenessRate === 100) return 'excellent';
  if (completenessRate >= 95 && newOrdersFound <= 5) return 'good';
  if (completenessRate >= 90 && newOrdersFound <= 20) return 'attention';
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

// ===== API INTEGRATION FUNCTIONS =====
async function fetchWithRetry(
  url: string, 
  options: RequestInit = {}, 
  retries: number = AUTO_SYNC_CONFIG.maxRetries
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AUTO_SYNC_CONFIG.requestTimeout);
      
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
        await delay(AUTO_SYNC_CONFIG.retryDelay * attempt);
      }
    }
  }
  
  throw lastError || new Error('All fetch attempts failed');
}

// Call your existing apiAnaliticaReview endpoint
async function callReviewAPI(dateFrom: string, dateTo: string): Promise<any> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/apiAnaliticaReview?dateFrom=${dateFrom}&dateTo=${dateTo}`;
  
  console.log(`🔍 Calling review API: ${url}`);
  
  const response = await fetchWithRetry(url, {
    headers: { 'Content-Type': 'application/json' }
  });
  
  return await response.json();
}

// Call your existing apiAnaliticaReload endpoint
async function callReloadAPI(orderIds: string[]): Promise<any> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/apiAnaliticaReload`;
  
  console.log(`🔄 Calling reload API with ${orderIds.length} orders`);
  
  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderIds })
  });
  
  return await response.json();
}

// ===== MAIN AUTO SYNC LOGIC =====
async function performAutoSync(): Promise<AutoSyncResponse> {
  const startTime = Date.now();
  const checkTime = new Date().toISOString();
  
  console.log(`🚀 Starting auto-sync monitor at ${checkTime}`);
  
  // Generate date range for recent orders
  const { dateFrom, dateTo } = generateRecentDateRange();
  console.log(`📅 Checking date range: ${dateFrom} to ${dateTo} (last ${AUTO_SYNC_CONFIG.recentHoursToCheck} hours)`);
  
  try {
    // Step 1: Call review API to detect new orders
    console.log(`📊 Step 1: Detecting new orders...`);
    const reviewResult = await callReviewAPI(dateFrom, dateTo);
    
    if (!reviewResult.success) {
      throw new Error(`Review API failed: ${reviewResult.error}`);
    }
    
    const newOrderIds = reviewResult.missingOrderIds || [];
    const vtexApiTotal = reviewResult.summary?.vtexApiTotal || 0;
    const databaseTotal = reviewResult.summary?.databaseTotal || 0;
    const completenessRate = reviewResult.summary?.completenessRate || 100;
    
    console.log(`📊 Detection results: ${newOrderIds.length} new orders found`);
    console.log(`📊 Completeness rate: ${completenessRate}%`);
    
    let processingResults = null;
    let vtexSuccess = 0;
    let sapSuccess = 0;
    let processingTime = 0;
    
    // Step 2: Process new orders if any found
    if (newOrderIds.length >= AUTO_SYNC_CONFIG.minOrdersToProcess) {
      if (newOrderIds.length > AUTO_SYNC_CONFIG.maxOrdersPerBatch) {
        console.log(`⚠️ Found ${newOrderIds.length} orders, limiting to ${AUTO_SYNC_CONFIG.maxOrdersPerBatch} for safety`);
        newOrderIds.splice(AUTO_SYNC_CONFIG.maxOrdersPerBatch);
      }
      
      console.log(`🔄 Step 2: Processing ${newOrderIds.length} new orders...`);
      const processStartTime = Date.now();
      
      try {
        processingResults = await callReloadAPI(newOrderIds);
        processingTime = Date.now() - processStartTime;
        
        if (processingResults.success) {
          vtexSuccess = processingResults.results?.vtexOrdersProcessed || 0;
          sapSuccess = processingResults.results?.sapOrdersMatched || 0;
          console.log(`✅ Processing completed: ${vtexSuccess} VTEX, ${sapSuccess} SAP orders processed`);
        } else {
          console.log(`❌ Processing failed: ${processingResults.error}`);
        }
        
      } catch (error) {
        console.error(`❌ Processing error:`, error);
        processingResults = { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown processing error' 
        };
      }
    } else {
      console.log(`✅ No new orders to process (found ${newOrderIds.length}, minimum ${AUTO_SYNC_CONFIG.minOrdersToProcess})`);
    }
    
    const totalExecutionTime = Date.now() - startTime;
    const systemHealth = assessSystemHealth(completenessRate, newOrderIds.length);
    
    console.log(`✅ Auto-sync completed in ${totalExecutionTime}ms`);
    console.log(`🏥 System health: ${systemHealth}`);
    
    return {
      success: true,
      summary: {
        checkTime,
        dateRange: { from: dateFrom, to: dateTo },
        detection: {
          vtexApiTotal,
          databaseTotal,
          newOrdersFound: newOrderIds.length,
          completenessRate
        },
        processing: {
          ordersProcessed: newOrderIds.length,
          vtexSuccess,
          sapSuccess,
          processingTime
        }
      },
      newOrderIds,
      processingResults,
      metadata: {
        totalExecutionTime,
        nextCheckRecommended: calculateNextCheckTime(),
        systemHealth
      }
    };
    
  } catch (error) {
    console.error(`❌ Auto-sync error:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown auto-sync error',
      summary: {
        checkTime,
        dateRange: { from: dateFrom, to: dateTo },
        detection: {
          vtexApiTotal: 0,
          databaseTotal: 0,
          newOrdersFound: 0,
          completenessRate: 0
        },
        processing: {
          ordersProcessed: 0,
          vtexSuccess: 0,
          sapSuccess: 0,
          processingTime: 0
        }
      },
      newOrderIds: [],
      metadata: {
        totalExecutionTime: Date.now() - startTime,
        nextCheckRecommended: calculateNextCheckTime(),
        systemHealth: 'critical'
      }
    };
  }
}

// ===== API HANDLER =====
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AutoSyncResponse>
) {
  const startTime = Date.now();
  
  // Allow both GET and POST requests
  if (!['GET', 'POST'].includes(req.method || '')) {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET or POST.',
      summary: {} as any,
      newOrderIds: [],
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
      newOrderIds: [],
      metadata: {} as any
    });
  }

  try {
    console.log(`🚀 Auto Sync Monitor API request from ${clientIp}`);

    // Perform auto-sync operation
    const result = await performAutoSync();
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ Auto Sync Monitor API response sent in ${responseTime}ms`);
    
    // Update response time in metadata
    result.metadata.totalExecutionTime = responseTime;
    
    res.status(200).json(result);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Auto Sync Monitor API Error after ${responseTime}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      summary: {
        checkTime: new Date().toISOString(),
        dateRange: { from: '', to: '' },
        detection: {
          vtexApiTotal: 0,
          databaseTotal: 0,
          newOrdersFound: 0,
          completenessRate: 0
        },
        processing: {
          ordersProcessed: 0,
          vtexSuccess: 0,
          sapSuccess: 0,
          processingTime: 0
        }
      },
      newOrderIds: [],
      metadata: {
        totalExecutionTime: responseTime,
        nextCheckRecommended: calculateNextCheckTime(),
        systemHealth: 'critical'
      }
    });
  } finally {
    // Always disconnect Prisma
    await prisma.$disconnect();
  }
}


