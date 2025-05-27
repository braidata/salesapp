import { NextApiRequest, NextApiResponse } from 'next';
import sql, { ConnectionPool } from 'mssql';
import { decodeBase64 } from '../../utils/decrypt';

// Validación de variables de entorno necesarias para la conexión a SQL
if (
  !process.env.AWS_SAP_USER ||
  !process.env.AWS_SAP_PASSWORD ||
  !process.env.AWS_SAP_SERVER ||
  !process.env.AWS_SAP_DATABASE ||
  !process.env.AWS_SAP_PORT
) {
  throw new Error('Faltan variables de entorno requeridas para la conexión a SQL');
}

const config: sql.config = {
  user: process.env.AWS_SAP_USER,
  password: decodeBase64(process.env.AWS_SAP_PASSWORD),
  server: process.env.AWS_SAP_SERVER,
  port: parseInt(process.env.AWS_SAP_PORT, 10),
  database: process.env.AWS_SAP_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

let pool: ConnectionPool | null = null;
async function getConnectionPool(): Promise<ConnectionPool> {
  if (pool) return pool;
  pool = await sql.connect(config);
  return pool;
}

function parseFields(fieldsParam: string | string[] | undefined, allFields: string[]): string[] {
  if (!fieldsParam) return allFields;
  if (Array.isArray(fieldsParam)) fieldsParam = fieldsParam.join(',');
  const requested = fieldsParam.split(',').map(f => f.trim()).filter(Boolean);
  // Solo devolver campos válidos
  return requested.filter(f => allFields.includes(f));
}

function validateDateFormat(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  
  try {
    const pool = await getConnectionPool();

    // Leer filtros desde query params
    const { ecommerce, from, to, fields } = req.query;

    // Validación de parámetros de fecha
    if (from && typeof from === 'string' && !validateDateFormat(from)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de fecha "from" inválido. Use YYYY-MM-DD',
        timestamp: new Date().toISOString()
      });
    }

    if (to && typeof to === 'string' && !validateDateFormat(to)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de fecha "to" inválido. Use YYYY-MM-DD',
        timestamp: new Date().toISOString()
      });
    }

    // LOGGING PARA DEBUG
    console.log('🔍 SQL API Request:', {
      ecommerce,
      from,
      to,
      fields,
      timestamp: new Date().toISOString()
    });

    // Obtener columnas de ambas tablas en una sola consulta
    const schemaResult = await pool.request().query(`
      SELECT 
        'pedidos_externos' as table_name,
        COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'pedidos_externos'
      
      UNION ALL
      
      SELECT 
        'pedidos_externos_detalle' as table_name,
        COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'pedidos_externos_detalle'
    `);

    const allFields = schemaResult.recordset
      .filter(row => row.table_name === 'pedidos_externos')
      .map(row => row.COLUMN_NAME);

    // Construir filtros dinámicos CON CORRECCIÓN DE ZONA HORARIA
    let whereClauses: string[] = [];
    let params: { [key: string]: any } = {};

    if (ecommerce) {
      whereClauses.push('p.Ecommerce = @ecommerce');
      params['ecommerce'] = ecommerce;
    }

    // CORRECCIÓN: Ajustar zona horaria (-4 horas para convertir a hora local de Chile)
    if (from && to) {
      whereClauses.push('CAST(DATEADD(HOUR, -4, p.FechaPedido) AS DATE) >= CAST(@from AS DATE)');
      whereClauses.push('CAST(DATEADD(HOUR, -4, p.FechaPedido) AS DATE) <= CAST(@to AS DATE)');
      params['from'] = from;
      params['to'] = to;
      
      console.log('🔍 Timezone-corrected date range filter applied:', {
        from: from,
        to: to,
        correction: 'Subtracting 3 hours from FechaPedido to convert to Chile time',
        sqlLogic: 'CAST(DATEADD(HOUR, -4, FechaPedido) AS DATE) between @from and @to'
      });
    } else {
      if (from) {
        whereClauses.push('CAST(DATEADD(HOUR, -4, p.FechaPedido) AS DATE) >= CAST(@from AS DATE)');
        params['from'] = from;
        console.log('🔍 Timezone-corrected from date filter applied:', from);
      }
      if (to) {
        whereClauses.push('CAST(DATEADD(HOUR, -4, p.FechaPedido) AS DATE) <= CAST(@to AS DATE)');
        params['to'] = to;
        console.log('🔍 Timezone-corrected to date filter applied:', to);
      }
    }

    const whereSQL = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

    // Selección de campos con prefijo para evitar conflictos
    const selectedFields = parseFields(fields, allFields);
    const selectSQL = selectedFields.length ? 
      selectedFields.map(field => `p.${field}`).join(', ') : 
      'p.*';

    // CONSULTA OPTIMIZADA: Una sola query con LEFT JOIN para traer pedidos y detalles
    const optimizedQuery = `
      WITH PedidosFiltered AS (
        SELECT ${selectSQL}
        FROM pedidos_externos p
        ${whereSQL}
      ),
      PedidosWithDetails AS (
        SELECT 
          p.*,
          d.ID as detalle_id,
          d.IDPedido as detalle_idpedido,
          d.SKU as detalle_sku,
          d.Cantidad as detalle_cantidad,
          d.PrecioUnitario as detalle_preciounitario,
          d.SubTotal as detalle_subtotal,
          d.Descuento as detalle_descuento,
          d.Total as detalle_total,
          d.CodigoExterno as detalle_codigoexterno,
          d.ts as detalle_ts,
          d.linea as detalle_linea
        FROM PedidosFiltered p
        LEFT JOIN pedidos_externos_detalle d ON p.ID = d.idpedido
      )
      SELECT * FROM PedidosWithDetails
      ORDER BY FechaPedido DESC, detalle_id ASC;
      
      -- Consulta separada para obtener lista de ecommerce
      SELECT DISTINCT Ecommerce FROM pedidos_externos;
    `;

    // DEBUG LOGGING DE LA QUERY
    console.log('🔍 Optimized SQL Query Debug:', {
      whereClauses,
      params,
      timezoneNote: 'Using DATEADD(HOUR, -4, FechaPedido) to convert to Chile time',
      optimization: 'Single query with LEFT JOIN to fetch pedidos and detalles'
    });

    // Ejecutar consulta optimizada
    let request = pool.request();
    Object.entries(params).forEach(([key, value]) => {
      request = request.input(key, value);
    });

    const result = await request.query(optimizedQuery);
    
    // Procesar resultados: agrupar detalles por pedido
    const pedidosMap = new Map();
    const rawData = result.recordsets[0] || [];
    
    rawData.forEach((row: any) => {
      const pedidoId = row.ID;
      
      if (!pedidosMap.has(pedidoId)) {
        // Extraer solo los campos del pedido (sin prefijo detalle_)
        const pedidoData: any = {};
        Object.keys(row).forEach(key => {
          if (!key.startsWith('detalle_')) {
            pedidoData[key] = row[key];
          }
        });
        
        pedidoData.detalles = [];
        pedidoData.FechaPedidoLocal = pedidoData.FechaPedido ? 
          new Date(new Date(pedidoData.FechaPedido).getTime() - 3 * 60 * 60 * 1000).toISOString() : null;
        
        pedidosMap.set(pedidoId, pedidoData);
      }
      
      // Agregar detalle si existe
      if (row.detalle_id) {
        const detalle = {
          ID: row.detalle_id,
          IDPedido: row.detalle_idpedido,
          SKU: row.detalle_sku,
          Cantidad: row.detalle_cantidad,
          PrecioUnitario: row.detalle_preciounitario,
          SubTotal: row.detalle_subtotal,
          Descuento: row.detalle_descuento,
          Total: row.detalle_total,
          CodigoExterno: row.detalle_codigoexterno,
          ts: row.detalle_ts,
          linea: row.detalle_linea
        };
        pedidosMap.get(pedidoId).detalles.push(detalle);
      }
    });

    const pedidos = Array.from(pedidosMap.values());
    const ecommerceResult = result.recordsets[1] || [];
    const totalDetalles = pedidos.reduce((sum, p) => sum + p.detalles.length, 0);

    // LOGGING DE RESULTADOS
    console.log('🔍 Optimized SQL Query Results:', {
      pedidosFound: pedidos.length,
      totalDetalles,
      firstPedidoDate: pedidos[0]?.FechaPedido,
      lastPedidoDate: pedidos[pedidos.length - 1]?.FechaPedido,
      processingTime: `${Date.now() - startTime}ms`,
      optimization: 'Single query execution vs multiple queries'
    });

    // COMPARACIÓN DE ZONA HORARIA EN DESARROLLO
    if (from && to && ecommerce && process.env.NODE_ENV === 'development') {
      try {
        const comparisonQuery = `
          SELECT 
            'without_timezone' as type, COUNT(*) as count
          FROM pedidos_externos
          WHERE Ecommerce = @ecommerce
            AND CAST(FechaPedido AS DATE) >= CAST(@from AS DATE)
            AND CAST(FechaPedido AS DATE) <= CAST(@to AS DATE)
          
          UNION ALL
          
          SELECT 
            'with_timezone' as type, COUNT(*) as count
          FROM pedidos_externos
          WHERE Ecommerce = @ecommerce
            AND CAST(DATEADD(HOUR, -4, FechaPedido) AS DATE) >= CAST(@from AS DATE)
            AND CAST(DATEADD(HOUR, -4, FechaPedido) AS DATE) <= CAST(@to AS DATE)
        `;

        const comparisonResult = await pool.request()
          .input('ecommerce', ecommerce)
          .input('from', from)
          .input('to', to)
          .query(comparisonQuery);

        const counts = comparisonResult.recordset.reduce((acc: any, row: any) => {
          acc[row.type] = row.count;
          return acc;
        }, {});

        console.log('🔍 Timezone Comparison:', {
          withoutTimezoneAdjustment: counts.without_timezone || 0,
          withTimezoneAdjustment: counts.with_timezone || 0,
          difference: (counts.with_timezone || 0) - (counts.without_timezone || 0),
          note: 'Positive difference means timezone adjustment found more records'
        });
      } catch (comparisonError: any) {
        console.warn('Could not perform timezone comparison:', comparisonError.message);
      }
    }

    // Preparar respuesta final
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      filters: {
        ecommerce,
        from,
        to,
        fields: selectedFields.length > 0 ? selectedFields : 'all',
        timezoneAdjustment: '-4 hours (converting to Chile time)'
      },
      ecommerceCount: ecommerceResult.length,
      ecommerceList: ecommerceResult.map((row: any) => row.Ecommerce),
      tableFields: allFields,
      pedidos,
      summary: {
        totalPedidos: pedidos.length,
        totalDetalles,
        processingTime: `${Date.now() - startTime}ms`,
        dateRange: pedidos.length > 0 ? {
          from: pedidos[pedidos.length - 1]?.FechaPedido,
          to: pedidos[0]?.FechaPedido
        } : null,
        timezoneNote: 'All FechaPedido values are stored with +3 hour offset. Filter uses DATEADD(HOUR, -4, FechaPedido) to match Chile time.'
      }
    };

    // LOGGING FINAL
    console.log('🔍 API Response Summary:', {
      success: true,
      pedidosReturned: response.pedidos.length,
      totalDetalles,
      timezoneAdjusted: true,
      processingTime: response.summary.processingTime,
      optimization: 'Used single optimized query with LEFT JOIN'
    });

    res.status(200).json(response);

  } catch (err: any) {
    // LOGGING DE ERRORES MEJORADO
    console.error('🔍 SQL API Error:', {
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : 'Stack trace hidden in production',
      timestamp: new Date().toISOString(),
      params: req.query,
      processingTime: `${Date.now() - startTime}ms`
    });

    res.status(500).json({ 
      success: false,
      error: err.message || 'Error interno del servidor',
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'development' ? {
        stack: err.stack,
        query: req.query
      } : undefined
    });
  }
}