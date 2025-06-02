// hooks/useVtexAnalytics.ts
import { useState, useCallback, useRef } from 'react';

// VTEX Analytics Types
export interface VtexOrder {
    orderId: string;
    sequence: string;
    status: string;
    statusDescription: string;
    value: number; // En centavos
    creationDate: string;
    lastChange: string;
    authorizedDate?: string;
    invoicedDate?: string;
    isCompleted: boolean;
    totals: Array<{
        id: string;
        name: string;
        value: number;
    }>;
    sellers: Array<{
        id: string;
        name: string;
    }>;
    clientProfileData: {
        email: string;
        firstName: string;
        lastName: string;
        document: string;
        phone: string;
        corporateName?: string;
        isCorporate: boolean;
    };
    items: VtexOrderItem[];
    shippingData: {
        address: {
            street: string;
            number: string;
            city: string;
            state: string;
            country: string;
            postalCode: string;
            neighborhood: string;
        };
        logisticsInfo: Array<{
            deliveryCompany: string;
            shippingEstimate: string;
            price: number;
            deliveryChannel: string;
        }>;
    };
    paymentData: {
        transactions: Array<{
            payments: Array<{
                paymentSystemName: string;
                value: number;
                installments: number;
                group: string;
            }>;
        }>;
    };
    packageAttachment?: {
        packages: Array<{
            invoiceNumber: string;
            invoiceUrl?: string;
            trackingNumber?: string;
            trackingUrl?: string;
            courier: string;
        }>;
    };
    [key: string]: any;
}

export interface VtexOrderItem {
    uniqueId: string;
    id: string;
    productId: string;
    name: string;
    refId: string;
    quantity: number;
    price: number; // En centavos
    listPrice: number;
    sellingPrice: number;
    imageUrl: string;
    detailUrl: string;
    additionalInfo: {
        brandName: string;
        brandId: string;
        categories: Array<{ id: number; name: string }>;
        dimension: {
            weight: number;
            height: number;
            length: number;
            width: number;
        };
    };
    seller: string;
    priceTags?: Array<{
        name: string;
        value: number;
        isPercentual: boolean;
    }>;
}

export interface VtexOrdersData {
    orders: VtexOrder[];
    summary: {
        total: number;
        processed: number;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        stats: {
            totalValue: number;
            averageOrderValue: number;
            statusBreakdown: Record<string, number>;
            paymentMethodBreakdown: Record<string, number>;
        };
    };
    lastFetch: string;
}

export interface VtexFilters {
    status?: string[];
    dateFrom?: string;
    dateTo?: string;
    minValue?: number; // En pesos, no centavos
    maxValue?: number; // En pesos, no centavos
    paymentMethod?: string[];
    seller?: string[];
    customer?: string;
    hasTracking?: boolean;
}

// Date utility
const convertRelativeDateToISO = (relativeDate: string, isEndDate = false): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start at beginning of day

    const getDateWithBoundary = (date: Date): string => {
        const d = new Date(date);
        if (isEndDate) {
            d.setHours(23, 59, 59, 999); // End of day
        } else {
            d.setHours(0, 0, 0, 0); // Start of day
        }
        return d.toISOString();
    };

    switch (relativeDate) {
        case 'today':
            return getDateWithBoundary(today);
        case 'yesterday': {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return getDateWithBoundary(yesterday);
        }
        case '7daysAgo': {
            const sevenDays = new Date(today);
            sevenDays.setDate(sevenDays.getDate() - 7);
            return getDateWithBoundary(sevenDays);
        }
        case '30daysAgo': {
            const thirtyDays = new Date(today);
            thirtyDays.setDate(thirtyDays.getDate() - 30);
            return getDateWithBoundary(thirtyDays);
        }
        case '2025-01-01':
        case '2020-01-01':
            return getDateWithBoundary(new Date(relativeDate));
        default:
            if (relativeDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return getDateWithBoundary(new Date(relativeDate));
            }
            return getDateWithBoundary(today);
    }
};

const adjustTimeZone = (dateString: string): string => {
    if (!dateString) return dateString;
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        date.setHours(date.getHours() - 4);
        return date.toISOString();
    } catch (error) {
        console.warn('Error adjusting timezone:', error);
        return dateString;
    }
};

// Currency formatter
const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

// VTEX Service
const useVtexService = () => {
    const baseUrl = '/api';

    const fetchOrdersList = async (params: {
        startDate: string;
        endDate: string;
        perPage?: number;
        page?: number;
    }) => {
        const queryParams = new URLSearchParams({
            startDate: params.startDate,
            endDate: params.endDate,
            page: (params.page || 1).toString(),
            perPage: (params.perPage || 50).toString(),
            includeItems: 'true',
            includePayments: 'true'
        });

        const url = `${baseUrl}/vtex-orders-db?${queryParams.toString()}`;
        console.log('🔗 Calling DB API:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('DB API Error Response:', errorText);
            throw new Error(`Orders DB API Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        // Adjust timezone in the response data
        if (result.data) {
            result.data = result.data.map((order: any) => ({
                ...order,
                creationDate: adjustTimeZone(order.creationDate),
                lastChange: adjustTimeZone(order.lastChange),
                authorizedDate: adjustTimeZone(order.authorizedDate),
                invoicedDate: adjustTimeZone(order.invoicedDate)
            }));
        }

        console.log('✅ Orders DB API Response:', {
            success: result.success,
            count: result.data?.length || 0,
            metadata: result.metadata
        });

        return result.data || [];
    };

    const fetchOrderDetails = async (orderId: string) => {
        const url = `${baseUrl}/vtex-orders-db?orderId=${encodeURIComponent(orderId)}`;
        console.log('🔗 Calling order details from DB:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Order Details DB Error Response:', errorText);
            throw new Error(`Order details DB Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        // Adjust timezone in the order details
        if (result.data?.[0]) {
            const order = result.data[0];
            result.data[0] = {
                ...order,
                creationDate: adjustTimeZone(order.creationDate),
                lastChange: adjustTimeZone(order.lastChange),
                authorizedDate: adjustTimeZone(order.authorizedDate),
                invoicedDate: adjustTimeZone(order.invoicedDate)
            };
        }

        const order = result.data?.[0];

        if (!order) {
            throw new Error(`Order ${orderId} not found in database`);
        }

        console.log('✅ Order Details DB Response:', {
            orderId: order.orderId,
            hasItems: !!order.items,
            itemsCount: order.items?.length || 0
        });

        return order;
    };

    const fetchProducts = async (params: {
        from?: number;
        to?: number;
        categoryId?: string;
        brandId?: string;
    } = {}) => {
        const { from = 0, to = 50, categoryId, brandId } = params;

        const queryParams = new URLSearchParams({
            page: String(Math.floor(from / 50) + 1),
            perPage: '50'
        });

        if (categoryId) queryParams.append('categoryId', categoryId);
        if (brandId) queryParams.append('brandId', brandId);

        const url = `${baseUrl}/vtex-products-db?${queryParams.toString()}`;
        console.log('🔗 Calling products from DB:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Products DB Error Response:', errorText);
            throw new Error(`Products DB Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Products DB Response:', {
            success: result.success,
            count: result.data?.length || 0,
            metadata: result.metadata
        });

        return result.data || [];
    };

    return {
        fetchOrdersList,
        fetchOrderDetails,
        fetchProducts,
        progress: 0
    };
};

// Main Hook
export const useVtexAnalytics = () => {
    // States
    const [data, setData] = useState<VtexOrdersData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    // Services
    const vtexService = useVtexService();

    // Cache
    const cacheRef = useRef<Record<string, {
        data: VtexOrdersData;
        timestamp: number;
        ttl: number;
    }>>({});

    const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

    // Cache management
    const clearCache = useCallback(() => {
        console.log('🗑️ Clearing VTEX cache');
        cacheRef.current = {};
    }, []);

    const clearExpiredCache = useCallback(() => {
        const now = Date.now();
        let clearedCount = 0;
        Object.keys(cacheRef.current).forEach(key => {
            if (now - cacheRef.current[key].timestamp > cacheRef.current[key].ttl) {
                delete cacheRef.current[key];
                clearedCount++;
            }
        });
        if (clearedCount > 0) {
            console.log(`🗑️ Cleared ${clearedCount} expired VTEX cache entries`);
        }
    }, []);

    // Main fetch function
    const fetchOrders = useCallback(async (
        startDate: string,
        endDate: string,
        options: {
            maxOrders?: number;
            forceRefresh?: boolean;
            includeDetails?: boolean;
        } = {}
    ) => {
        const {
            maxOrders = 5000,
            forceRefresh = false,
            includeDetails = false
        } = options;

        const cacheKey = `vtex-orders-${startDate}-${endDate}-${maxOrders}-${includeDetails ? 'detailed' : 'basic'}`;

        clearExpiredCache();
        if (!forceRefresh && cacheRef.current[cacheKey]) {
            const cachedData = cacheRef.current[cacheKey].data;
            const cacheAge = Date.now() - cacheRef.current[cacheKey].timestamp;
            console.log(`📦 Using cached VTEX data (${Math.round(cacheAge / 1000)}s old)`);
            setData(cachedData);
            setError(null);
            return cachedData;
        }

        try {
            setLoading(true);
            setError(null);
            setProgress(10);

            const startDateISO = convertRelativeDateToISO(startDate, false);
            const endDateISO = convertRelativeDateToISO(endDate, true);

            const startDateObj = new Date(startDateISO);
            const endDateObj = new Date(endDateISO);
            const daysDifference = Math.ceil(
                (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysDifference > 180) {
                const errorMsg = 'No se pueden consultar más de 30 días de datos VTEX por razones de performance y límites de API';
                setError(errorMsg);
                throw new Error(errorMsg);
            }

            console.log('📦 Fetching VTEX orders via your API:', {
                original: { startDate, endDate },
                converted: { startDateISO, endDateISO },
                daysDifference,
                maxOrders,
                includeDetails,
                cacheKey
            });

            setProgress(20);
            const ordersList = await vtexService.fetchOrdersList({
                startDate: startDateISO,
                endDate: endDateISO,
                perPage: maxOrders,
                page: 1
            });

            console.log(`📦 Received ${ordersList?.length || 0} orders from your API`);
            if (!Array.isArray(ordersList)) {
                throw new Error(`Invalid response from your API - expected array, got ${typeof ordersList}`);
            }

            setProgress(50);
            let processedOrders = ordersList;

            if (includeDetails && ordersList.length > 0) {
                console.log('📦 Fetching detailed order information...');
                const detailedOrders: VtexOrder[] = [];
                const batchSize = 5;

                for (let i = 0; i < ordersList.length; i += batchSize) {
                    const batch = ordersList.slice(i, i + batchSize);

                    const batchPromises = batch.map(async (basicOrder) => {
                        try {
                            const detailed = await vtexService.fetchOrderDetails(
                                basicOrder.orderId || basicOrder.sequence
                            );
                            return detailed || basicOrder;
                        } catch (err) {
                            console.warn(`Failed to get details for ${basicOrder.orderId}:`, err);
                            return basicOrder;
                        }
                    });

                    const batchResults = await Promise.allSettled(batchPromises);
                    const successfulResults = batchResults
                        .filter(r => r.status === 'fulfilled')
                        .map(r => (r as PromiseFulfilledResult<any>).value)
                        .filter(Boolean);

                    detailedOrders.push(...successfulResults);

                    const currentProgress = 50 + Math.round(((i + batchSize) / ordersList.length) * 30);
                    setProgress(Math.min(currentProgress, 80));

                    if (i + batchSize < ordersList.length) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                }

                processedOrders = detailedOrders;
                console.log(`📦 Processed ${processedOrders.length}/${ordersList.length} orders with details`);
            }

            setProgress(80);

            const totalValue = processedOrders.reduce((sum, order) => {
                const value = order.value || 0;
                return sum + value;
            }, 0);

            const averageOrderValue = processedOrders.length > 0 ? totalValue / processedOrders.length : 0;

            const statusBreakdown = processedOrders.reduce((acc, order) => {
                const status = order.statusDescription || order.status || 'Unknown';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const paymentMethodBreakdown = processedOrders.reduce((acc, order) => {
                if (order.paymentData?.transactions) {
                    order.paymentData.transactions.forEach(transaction => {
                        transaction.payments?.forEach(payment => {
                            const method = payment.paymentSystemName || 'Unknown';
                            acc[method] = (acc[method] || 0) + 1;
                        });
                    });
                } else {
                    acc['Unknown'] = (acc['Unknown'] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);

            const vtexData: VtexOrdersData = {
                orders: processedOrders,
                summary: {
                    total: ordersList.length,
                    processed: processedOrders.length,
                    dateRange: {
                        startDate: startDateISO,
                        endDate: endDateISO
                    },
                    stats: {
                        totalValue: totalValue / 100,
                        averageOrderValue: averageOrderValue / 100,
                        statusBreakdown,
                        paymentMethodBreakdown
                    }
                },
                lastFetch: new Date().toISOString()
            };

            cacheRef.current[cacheKey] = {
                data: vtexData,
                timestamp: Date.now(),
                ttl: CACHE_TTL
            };

            setData(vtexData);
            setProgress(100);

            console.log('📦 VTEX fetch completed successfully:', {
                totalOrders: vtexData.orders.length,
                daysPeriod: daysDifference,
                totalValue: formatCurrency(vtexData.summary.stats.totalValue),
                avgOrderValue: formatCurrency(vtexData.summary.stats.averageOrderValue),
                statusBreakdown: Object.keys(vtexData.summary.stats.statusBreakdown),
                paymentMethods: Object.keys(vtexData.summary.stats.paymentMethodBreakdown)
            });

            return vtexData;
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to fetch VTEX orders from your API';
            setError(errorMessage);
            console.error('📦 VTEX fetch error:', {
                error: err,
                message: errorMessage,
                startDate,
                endDate,
                options
            });
            return null;
        } finally {
            setLoading(false);
            setProgress(0);
        }
    }, [vtexService, clearExpiredCache]);

    // Filter orders
    const getFilteredOrders = useCallback((filters?: VtexFilters): VtexOrder[] => {
        if (!data?.orders) return [];

        let filteredOrders = [...data.orders];

        if (filters) {
            if (filters.status?.length) {
                filteredOrders = filteredOrders.filter(order =>
                    filters.status!.includes(order.status)
                );
            }

            if (filters.dateFrom) {
                const fromDate = convertRelativeDateToISO(filters.dateFrom);
                filteredOrders = filteredOrders.filter(order =>
                    order.creationDate >= fromDate
                );
            }

            if (filters.dateTo) {
                const toDate = convertRelativeDateToISO(filters.dateTo);
                filteredOrders = filteredOrders.filter(order =>
                    order.creationDate <= toDate
                );
            }

            if (filters.minValue !== undefined) {
                filteredOrders = filteredOrders.filter(order =>
                    (order.value / 100) >= filters.minValue!
                );
            }

            if (filters.maxValue !== undefined) {
                filteredOrders = filteredOrders.filter(order =>
                    (order.value / 100) <= filters.maxValue!
                );
            }

            if (filters.paymentMethod?.length) {
                filteredOrders = filteredOrders.filter(order => {
                    if (!order.paymentData?.transactions) return false;
                    return order.paymentData.transactions.some(transaction =>
                        transaction.payments?.some(payment =>
                            filters.paymentMethod!.includes(payment.paymentSystemName)
                        )
                    );
                });
            }

            if (filters.seller?.length) {
                filteredOrders = filteredOrders.filter(order =>
                    order.sellers?.some(seller =>
                        filters.seller!.includes(seller.id)
                    )
                );
            }

            if (filters.customer) {
                const customerFilter = filters.customer.toLowerCase();
                filteredOrders = filteredOrders.filter(order =>
                    order.clientProfileData?.firstName?.toLowerCase().includes(customerFilter) ||
                    order.clientProfileData?.lastName?.toLowerCase().includes(customerFilter) ||
                    order.clientProfileData?.email?.toLowerCase().includes(customerFilter) ||
                    order.clientProfileData?.document?.includes(customerFilter)
                );
            }

            if (filters.hasTracking !== undefined) {
                filteredOrders = filteredOrders.filter(order => {
                    const hasTracking = order.packageAttachment?.packages?.some(pkg =>
                        pkg.trackingNumber || pkg.trackingUrl
                    );
                    return filters.hasTracking ? hasTracking : !hasTracking;
                });
            }
        }

        return filteredOrders;
    }, [data]);

    // Get analytics data
    const getAnalytics = useCallback(() => {
        if (!data?.orders.length) {
            console.log('📦 No orders available for analytics');
            return null;
        }

        const orders = data.orders;
        console.log(`📦 Generating analytics for ${orders.length} orders`);

        const salesByDate = orders.reduce((acc, order) => {
            const date = order.creationDate.split('T')[0];
            const value = (order.value || 0) / 100;
            acc[date] = (acc[date] || 0) + value;
            return acc;
        }, {} as Record<string, number>);

        const ordersByDate = orders.reduce((acc, order) => {
            const date = order.creationDate.split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const productStats = orders.reduce((acc, order) => {
            if (!order.items || !Array.isArray(order.items)) return acc;

            order.items.forEach(item => {
                const key = item.refId || item.id || `unknown-${Math.random()}`;
                if (!acc[key]) {
                    acc[key] = {
                        sku: key,
                        nombre: item.name || 'Producto sin nombre',
                        cantidad: 0,
                        total: 0,
                        pedidos: new Set()
                    };
                }
                acc[key].cantidad += item.quantity || 0;
                acc[key].total += ((item.sellingPrice || item.price || 0) * (item.quantity || 0)) / 100;
                acc[key].pedidos.add(order.orderId);
            });
            return acc;
        }, {} as Record<string, any>);

        const topProducts = Object.values(productStats)
            .map((product: any) => ({
                ...product,
                pedidos: product.pedidos.size
            }))
            .sort((a: any, b: any) => b.total - a.total)
            .slice(0, 20);

        const analytics = {
            salesByDate: Object.entries(salesByDate)
                .map(([fecha, valor]) => ({ fecha, valor }))
                .sort((a, b) => a.fecha.localeCompare(b.fecha)),
            ordersByDate: Object.entries(ordersByDate)
                .map(([fecha, valor]) => ({ fecha, valor }))
                .sort((a, b) => a.fecha.localeCompare(b.fecha)),
            topProducts,
            summary: data.summary
        };

        console.log('📦 Analytics generated:', {
            salesDays: analytics.salesByDate.length,
            ordersDays: analytics.ordersByDate.length,
            topProductsCount: analytics.topProducts.length,
            period: `${data.summary.dateRange.startDate} to ${data.summary.dateRange.endDate}`
        });

        return analytics;
    }, [data]);

    return {
        data,
        loading,
        error,
        progress,
        fetchOrders,
        clearCache,
        getFilteredOrders,
        getAnalytics,
        formatCurrency,
        vtexService,
        _debug: {
            cache: Object.keys(cacheRef.current),
            cacheCount: Object.keys(cacheRef.current).length,
            lastFetch: data?.lastFetch,
            ordersCount: data?.orders.length || 0,
            lastUpdate: data ? new Date(data.lastFetch).toLocaleString() : null,
            hasData: !!data,
            hasOrders: !!(data?.orders?.length),
            dateRange: data ? `${data.summary.dateRange.startDate} - ${data.summary.dateRange.endDate}` : null
        }
    };
};
