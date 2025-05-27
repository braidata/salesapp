import { useState, useCallback } from 'react';
import { convertRelativeDateToISO } from './dataServices';

export const useSqlDataService = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async (startDate, endDate) => {
        try {
            setLoading(true);
            setError(null);
            
            const startDateISO = convertRelativeDateToISO(startDate);
            const endDateISO = convertRelativeDateToISO(endDate);

            const response = await fetch(
                `/api/sqlConnectorModernDashboard?ecommerce=VENTUSCORP_VTEX&from=${startDateISO}&to=${endDateISO}`
            );

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            setData(result);
            
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const clearCache = useCallback(() => {
        setData(null);
        setError(null);
    }, []);

    // Extraer y aplanar datos
    const pedidos = data?.pedidos || [];
    
    // Aplanar todos los detalles de todos los pedidos
    const detalles = pedidos.flatMap((pedido: any) => 
        (pedido.detalles || []).map((detalle: any) => ({
            ...detalle,
            IDPedido: pedido.ID // Agregar referencia al pedido padre
        }))
    );

    return {
        data,
        pedidos,
        detalles,
        loading,
        error,
        fetchData,
        clearCache
    };
};