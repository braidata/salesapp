// pages/api/debug-vtex-data.ts
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Obtenemos el orderId del query parameter o usamos uno por defecto
  const { orderId = "" } = req.query;

  try {
    // Verificar si tenemos un orderId específico o debemos obtener una lista
    if (orderId) {
      // Obtener detalles de un pedido específico
      const orderUrl = `https://imegab2c.myvtex.com/api/oms/pvt/orders/${orderId}`;
      console.log(`Requesting details for order: ${orderId}`);
      
      const orderResponse = await fetch(orderUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-VTEX-API-AppKey": process.env.API_VTEX_KEY || "",
          "X-VTEX-API-AppToken": process.env.API_VTEX_TOKEN || "",
        },
      });

      if (!orderResponse.ok) {
        throw new Error(`Error fetching order details: ${orderResponse.status}`);
      }

      const orderData = await orderResponse.json();
      
      // Extraer información específica para filtrado
      const diagnosticInfo = {
        orderId: orderData.orderId,
        status: orderData.status,
        statusDescription: orderData.statusDescription,
        origin: orderData.origin,
        
        // Información de pago
        paymentInfo: orderData.paymentData ? {
          transactions: orderData.paymentData.transactions?.map(t => ({
            transactionId: t.transactionId,
            payments: t.payments?.map(p => ({
              paymentSystem: p.paymentSystem,
              paymentSystemName: p.paymentSystemName,
              value: p.value,
              installments: p.installments,
              group: p.group
            }))
          }))
        } : null,
        
        // Información de envío
        shippingInfo: orderData.shippingData ? {
          address: orderData.shippingData.address,
          logisticsInfo: orderData.shippingData.logisticsInfo?.map(item => ({
            itemIndex: item.itemIndex,
            selectedSla: item.selectedSla,
            selectedDeliveryChannel: item.selectedDeliveryChannel,
            deliveryWindow: item.deliveryWindow,
            deliveryCompany: item.deliveryCompany,
            shippingEstimate: item.shippingEstimate,
            shippingEstimateDate: item.shippingEstimateDate,
            deliveryChannel: item.deliveryChannel,
            deliveryIds: item.deliveryIds
          }))
        } : null,
        
        // Información completa (reducida para no saturar la respuesta)
        fullData: {
          ...orderData,
          // Eliminar datos muy extensos para hacer la respuesta más manejable
          items: orderData.items ? `[${orderData.items.length} items]` : null,
          marketplaceItems: orderData.marketplaceItems ? `[${orderData.marketplaceItems.length} items]` : null
        }
      };
      
      return res.status(200).json(diagnosticInfo);
    } else {
      // Obtener lista de pedidos con información de diagnóstico
      const ordersUrl = `https://imegab2c.myvtex.com/api/oms/pvt/orders?_page=1&_perPage=5`;
      console.log("Fetching recent orders for diagnosis");
      
      const ordersResponse = await fetch(ordersUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-VTEX-API-AppKey": process.env.API_VTEX_KEY || "",
          "X-VTEX-API-AppToken": process.env.API_VTEX_TOKEN || "",
        },
      });

      if (!ordersResponse.ok) {
        throw new Error(`Error fetching orders: ${ordersResponse.status}`);
      }

      const ordersData = await ordersResponse.json();
      
      // Obtener detalles de cada uno de los pedidos (para obtener la info completa)
      const detailedOrders = await Promise.all(
        ordersData.list.slice(0, 2).map(async (order) => {
          try {
            const detailUrl = `https://imegab2c.myvtex.com/api/oms/pvt/orders/${order.orderId}`;
            const detailResponse = await fetch(detailUrl, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "X-VTEX-API-AppKey": process.env.API_VTEX_KEY || "",
                "X-VTEX-API-AppToken": process.env.API_VTEX_TOKEN || "",
              },
            });
            
            if (!detailResponse.ok) {
              return {
                orderId: order.orderId,
                error: `Failed to fetch details: ${detailResponse.status}`
              };
            }
            
            const detailData = await detailResponse.json();
            
            // Extraer información clave para diagnóstico
            return {
              orderId: detailData.orderId,
              sequence: detailData.sequence,
              status: detailData.status,
              statusDescription: detailData.statusDescription,
              origin: detailData.origin,
              creationDate: detailData.creationDate,
              
              // Información para filtros
              filterValues: {
                origin: detailData.origin,
                status: detailData.status,
                paymentSystemNames: detailData.paymentData?.transactions?.flatMap(t => 
                  t.payments?.map(p => p.paymentSystemName) || []
                ) || [],
                selectedDeliveryChannels: detailData.shippingData?.logisticsInfo?.map(item => 
                  item.selectedDeliveryChannel
                ) || []
              },
              
              // Rutas a información importante (para facilitar inspección en frontend)
              paths: {
                deliveryChannel: "shippingData.logisticsInfo[].selectedDeliveryChannel",
                paymentSystemName: "paymentData.transactions[].payments[].paymentSystemName",
                origin: "origin",
                status: "status"
              }
            };
          } catch (err) {
            return {
              orderId: order.orderId,
              error: String(err)
            };
          }
        })
      );
      
      const diagnosticInfo = {
        paging: ordersData.paging,
        orders: detailedOrders,
        rawOrdersList: ordersData.list.slice(0, 5),
        availableFilters: {
          origin: Array.from(new Set(detailedOrders.map(o => o.origin).filter(Boolean))),
          status: Array.from(new Set(detailedOrders.map(o => o.status).filter(Boolean))),
          paymentSystemNames: Array.from(new Set(detailedOrders.flatMap(o => o.filterValues?.paymentSystemNames || []).filter(Boolean))),
          deliveryChannels: Array.from(new Set(detailedOrders.flatMap(o => o.filterValues?.selectedDeliveryChannels || []).filter(Boolean)))
        }
      };
      
      return res.status(200).json(diagnosticInfo);
    }
  } catch (error) {
    console.error("Error in VTEX diagnostic endpoint:", error);
    return res.status(500).json({ 
      message: "Error fetching diagnostic data", 
      error: String(error) 
    });
  }
}