// services/sapService.ts
import { useCallback } from 'react';

export const useSapService = () => {
  const baseUrl = '/api';

  // Memoizamos fetchOrdersList para que su referencia sea estable entre renders
  const fetchOrdersList = useCallback(
    async (params: {
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
        includeItems: 'true'
      });

      const url = `${baseUrl}/sap-orders-db?${queryParams.toString()}`;
      console.log('🔗 Calling SAP DB API:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('SAP DB API Error Response:', errorText);
        throw new Error(`SAP Orders DB API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      console.log('✅ SAP Orders DB API Response:', {
        success: result.success,
        count: result.data?.length || 0,
        metadata: result.metadata
      });

      return result.data || [];
    },
    []
  );

  // Memoizamos fetchOrderDetails para que su referencia sea estable entre renders
  const fetchOrderDetails = useCallback(
    async (purchaseOrder: string) => {
      const url = `${baseUrl}/sap-orders-db?purchaseOrder=${encodeURIComponent(purchaseOrder)}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`SAP Order details DB Error: ${response.status}`);
      }

      const result = await response.json();
      return result.data?.[0] || null;
    },
    []
  );

  return {
    fetchOrdersList,
    fetchOrderDetails
  };
};

