// components/dashboard/ui/DataTable.tsx
import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ArrowDownUp, Download, Copy } from 'lucide-react';
import { colors } from '../constants/colors';
import * as XLSX from 'xlsx';

// Tipos para las columnas y opciones de ordenamiento
type SortDirection = 'asc' | 'desc' | null;
type DataTableColumn = {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string | React.ReactNode;
  sortable?: boolean;
};

interface DataTableProps {
  data: any[];
  columns: DataTableColumn[];
  kpiKey: string;
  emptyMessage?: string;
  tableId?: string;
  initialSortColumn?: string;
  initialSortDirection?: SortDirection;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  kpiKey,
  emptyMessage = "No hay datos disponibles para mostrar",
  tableId = "data-table",
  initialSortColumn,
  initialSortDirection = null
}) => {
  // Estado para columna y dirección de ordenamiento
  const [sortColumn, setSortColumn] = useState<string | null>(initialSortColumn || null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);

  // Ordenar datos basado en columna y dirección
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const valueA = a[sortColumn];
      const valueB = b[sortColumn];

      // Manejar diferentes tipos de datos
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }

      if (valueA instanceof Date && valueB instanceof Date) {
        return sortDirection === 'asc' 
          ? valueA.getTime() - valueB.getTime() 
          : valueB.getTime() - valueA.getTime();
      }

      // Convertir a string para comparación de textos
      const strA = String(valueA || '').toLowerCase();
      const strB = String(valueB || '').toLowerCase();

      return sortDirection === 'asc' 
        ? strA.localeCompare(strB) 
        : strB.localeCompare(strA);
    });
  }, [data, sortColumn, sortDirection]);

  // Manejar clic en cabecera para ordenar
  const handleSortClick = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortColumn === columnKey) {
      // Si ya estaba ordenando por esta columna, cambia la dirección o resetea
      setSortDirection(
        sortDirection === 'asc' ? 'desc' : 
        sortDirection === 'desc' ? null : 'asc'
      );
      if (sortDirection === 'desc') setSortColumn(null);
    } else {
      // Nueva columna, inicia con ascendente
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Exportar a Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      sortedData.map(row => {
        const formattedRow: Record<string, any> = {};
        columns.forEach(col => {
          formattedRow[col.label] = row[col.key];
        });
        return formattedRow;
      })
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, kpiKey);
    XLSX.writeFile(workbook, `${kpiKey}_data_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Copiar al portapapeles
  const copyToClipboard = () => {
    // Crear texto delimitado por tabulaciones
    const headerRow = columns.map(col => col.label).join('\t');
    const dataRows = sortedData.map(row => 
      columns.map(col => {
        const value = row[col.key];
        return value !== undefined && value !== null ? value : '';
      }).join('\t')
    ).join('\n');
    
    const fullText = `${headerRow}\n${dataRows}`;
    
    navigator.clipboard.writeText(fullText)
      .then(() => {
        // Mostrar notificación de éxito
        const notification = document.createElement('div');
        notification.textContent = 'Tabla copiada al portapapeles';
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 20px';
        notification.style.background = colors.accent;
        notification.style.color = colors.secondary;
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '9999';
        notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        notification.style.transition = 'opacity 0.3s ease-in-out';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => document.body.removeChild(notification), 300);
        }, 2000);
      })
      .catch(err => console.error('Error al copiar:', err));
  };

  // Si no hay datos, mostrar mensaje
  if (sortedData.length === 0) {
    return (
      <div className="overflow-hidden w-full rounded-md h-full flex flex-col">
        <div className="flex justify-between items-center p-3 border-b" 
             style={{ borderColor: `${colors.accent}40`, backgroundColor: colors.secondary }}>
          <h3 className="font-medium text-sm" style={{ color: colors.text }}>Datos</h3>
          
          <div className="flex items-center gap-2">
            <button
              className="p-1.5 rounded-md transition-colors hover:bg-opacity-20 text-xs flex items-center gap-1"
              style={{ backgroundColor: `${colors.glass}20`, color: colors.text }}
              disabled={true}
            >
              <Copy size={14} />
              <span className="hidden sm:inline">Copiar</span>
            </button>
            <button
              className="p-1.5 rounded-md transition-colors hover:bg-opacity-20 text-xs flex items-center gap-1"
              style={{ backgroundColor: `${colors.glass}20`, color: colors.text }}
              disabled={true}
            >
              <Download size={14} />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-6 text-center"
             style={{ backgroundColor: colors.secondary, color: `${colors.text}80` }}>
          <div>
            <p>{emptyMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden w-full rounded-md h-full flex flex-col"
         style={{ backgroundColor: colors.secondary }}>
      {/* Header con título y acciones */}
      <div className="flex justify-between items-center p-3 border-b" 
           style={{ borderColor: `${colors.accent}40` }}>
        <h3 className="font-medium text-sm" style={{ color: colors.text }}>
          {sortedData.length} {sortedData.length === 1 ? 'registro' : 'registros'}
        </h3>
        
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="p-1.5 rounded-md transition-colors hover:bg-opacity-20 text-xs flex items-center gap-1"
            style={{ backgroundColor: `${colors.glass}20`, color: colors.text }}
            title="Copiar al portapapeles"
          >
            <Copy size={14} />
            <span className="hidden sm:inline">Copiar</span>
          </button>
          <button
            onClick={exportToExcel}
            className="p-1.5 rounded-md transition-colors hover:bg-opacity-20 text-xs flex items-center gap-1"
            style={{ backgroundColor: `${colors.glass}20`, color: colors.text }}
            title="Exportar a Excel"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>
      
      {/* Tabla con scroll */}
      <div className="overflow-auto flex-1 scrollbar-thin">
        <table id={tableId} className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`p-3 text-${column.align || 'left'} font-medium text-sm sticky top-0 z-10 cursor-${column.sortable ? 'pointer' : 'default'} select-none`}
                  style={{
                    backgroundColor: colors.secondary,
                    borderBottom: `2px solid ${colors.accent}40`,
                    color: sortColumn === column.key ? colors.accent : colors.text,
                  }}
                  onClick={() => handleSortClick(column.key)}
                >
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    {column.label}
                    
                    {column.sortable && (
                      <span className="inline-flex items-center">
                        {sortColumn === column.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp size={14} className="text-accent" style={{ color: colors.accent }} />
                          ) : sortDirection === 'desc' ? (
                            <ChevronDown size={14} className="text-accent" style={{ color: colors.accent }} />
                          ) : (
                            <ArrowDownUp size={14} className="opacity-30" />
                          )
                        ) : (
                          <ArrowDownUp size={14} className="opacity-30" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {sortedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="transition-colors"
                style={{
                  backgroundColor: 
                    hoveredRowIndex === rowIndex 
                      ? `${colors.accent}10` 
                      : rowIndex % 2 === 0 
                        ? `${colors.secondary}` 
                        : `${colors.glass}10`,
                  borderBottom: `1px solid ${colors.glass}20`,
                }}
                onMouseEnter={() => setHoveredRowIndex(rowIndex)}
                onMouseLeave={() => setHoveredRowIndex(null)}
              >
                {columns.map((column) => (
                  <td
                    key={`${rowIndex}-${column.key}`}
                    className={`p-3 text-${column.align || 'left'}`}
                    style={{ 
                      color: column.key === sortColumn ? colors.accent : colors.text
                    }}
                  >
                    {column.format 
                      ? column.format(row[column.key]) 
                      : row[column.key] !== undefined && row[column.key] !== null 
                        ? String(row[column.key]) 
                        : '—'
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;