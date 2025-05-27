'use client';
// components/Dashboard/ui/chartComponents.tsx
import React from 'react';
import DataTable from './DataTable';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    Sector,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ComposedChart,
    FunnelChart,
    Funnel,
    LabelList,
    Treemap,
} from "recharts";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { colors, tooltipStyle } from '../constants/colors';
import { formatCurrency } from '../services/dataServices';
import { Table2 } from 'lucide-react';

// Custom tooltip for pie charts
export const renderCustomizedPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div
                className="custom-tooltip"
                style={{
                    backgroundColor: colors.tooltipBackground,
                    border: `1px solid ${colors.tooltipBorder}`,
                    padding: "10px",
                    borderRadius: "4px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                }}
            >
                <p className="label" style={{ color: colors.text, fontWeight: "bold" }}>{`${payload[0].name}`}</p>
                <p className="value" style={{ color: colors.text }}>{`Valor: ${payload[0].value.toLocaleString()}`}</p>
                {payload[0].payload.tasaConversion !== undefined && (
                    <p className="conversion" style={{ color: colors.accent }}>
                        {`Conversión: ${payload[0].payload.tasaConversion.toFixed(2)}%`}
                    </p>
                )}
                <p
                    className="percent"
                    style={{ color: colors.accent }}
                >{`${payload[0].payload.percentage || (payload[0].percent * 100).toFixed(1) + "%"}`}</p>
            </div>
        );
    }
    return null;
};

// Custom active shape for pie charts
export const renderActiveShape = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";

    return (
        <g>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                stroke={colors.secondary}
                strokeWidth={2}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 6}
                outerRadius={outerRadius + 10}
                fill={colors.accent}
            />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={colors.text} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={colors.accent} stroke="none" />
            <text
                x={ex + (cos >= 0 ? 1 : -1) * 12}
                y={ey}
                textAnchor={textAnchor}
                fill={colors.text}
                style={{ fontSize: "12px" }}
            >
                {payload.name}
            </text>
            <text
                x={ex + (cos >= 0 ? 1 : -1) * 12}
                y={ey}
                dy={18}
                textAnchor={textAnchor}
                fill={colors.accent}
                style={{ fontSize: "12px" }}
            >
                {`${value.toLocaleString()} (${(percent * 100).toFixed(1)}%)`}
            </text>
            {payload.tasaConversion !== undefined && (
                <text
                    x={ex + (cos >= 0 ? 1 : -1) * 12}
                    y={ey}
                    dy={36}
                    textAnchor={textAnchor}
                    fill={colors.warning}
                    style={{ fontSize: "12px" }}
                >
                    {`Conversión: ${payload.tasaConversion.toFixed(2)}%`}
                </text>
            )}
        </g>
    );
};

// Export chart data to XLSX
export const exportToXLSX = (chartData: any[], kpiKey: string) => {
    if (chartData.length === 0) {
        alert("No hay datos disponibles para exportar");
        return;
    }

    try {
        // Crear una hoja de trabajo
        const worksheet = XLSX.utils.json_to_sheet(chartData);

        // Crear un libro de trabajo y añadir la hoja
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, kpiKey);

        // Generar el archivo y descargarlo
        XLSX.writeFile(workbook, `${kpiKey}_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (error) {
        console.error("Error al exportar a Excel:", error);
        alert("Error al exportar a Excel. Consulta la consola para más detalles.");
    }
};

// Export chart as PDF
export const exportToPDF = (kpiKey: string, kpiLabel: string) => {
  const chartContainer = document.getElementById(`chart-${kpiKey}`);
  if (!chartContainer) {
    alert("No se pudo encontrar el gráfico para exportar");
    return;
  }

  try {
    // Opciones para asegurar que se capture el fondo oscuro
    const options = {
      backgroundColor: colors.secondary,
      useCORS: true,
      scale: 2,
      removeContainer: false,
      onclone: (clonedDocument: any) => {
        const clonedElement = clonedDocument.getElementById(`chart-${kpiKey}`);
        if (clonedElement) {
          clonedElement.style.backgroundColor = colors.secondary;
          clonedElement.style.padding = '20px';
          clonedElement.style.borderRadius = '8px';
        }
      }
    };

    html2canvas(chartContainer, options).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      pdf.setFillColor(25, 43, 50);
      pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.setFontSize(16);
      pdf.setTextColor(224, 231, 255);
      pdf.text(`${kpiLabel || kpiKey}`, 14, 15);

      pdf.setFontSize(10);
      pdf.setTextColor(224, 231, 255);
      pdf.text(`Generado: ${new Date().toLocaleString()}`, 14, 22);

      pdf.addImage(imgData, "PNG", 10, 30, pdfWidth - 20, pdfHeight - 20);
      pdf.save(`${kpiKey}_${new Date().toISOString().split("T")[0]}.pdf`);
    });
  } catch (error) {
    console.error("Error al exportar a PDF:", error);
    alert("Error al exportar a PDF. Consulta la consola para más detalles.");
  }
};

// Copy chart as image
export const copyChartAsImage = (kpiKey: string) => {
    const chartContainer = document.getElementById(`chart-${kpiKey}`);
    if (!chartContainer) {
        alert("No se pudo encontrar el gráfico para copiar");
        return;
    }

    try {
        html2canvas(chartContainer).then((canvas) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    const item = new ClipboardItem({ "image/png": blob });
                    navigator.clipboard
                        .write([item])
                        .then(() => alert("Imagen copiada al portapapeles"))
                        .catch((err) => {
                            console.error("Error al copiar al portapapeles:", err);
                            alert("No se pudo copiar la imagen. Intenta con el botón PDF en su lugar.");
                        });
                }
            });
        });
    } catch (error) {
        console.error("Error al copiar como imagen:", error);
        alert("Error al copiar como imagen. Consulta la consola para más detalles.");
    }
};

// Render data as table
export const renderDataTable = (chartData: any[], kpiKey: string) => {
    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-center" style={{ color: colors.text }}>
                    No hay datos disponibles para mostrar en tabla
                </p>
            </div>
        );
    }

    const columns = Object.keys(chartData[0]).filter((col) => col !== "rawDate");

    return (
        <div className="overflow-auto h-full max-h-[400px]">
            <table className="w-full border-collapse" style={{ color: colors.text }}>
                <thead>
                    <tr style={{ backgroundColor: `${colors.secondary}90` }}>
                        {columns.map((column) => (
                            <th
                                key={column}
                                className="p-2 text-left border-b sticky top-0 z-10"
                                style={{
                                    borderColor: colors.accent,
                                    backgroundColor: colors.secondary,
                                }}
                            >
                                {column === "date" ? "Fecha"
                                    : column === "value" ? "Valor"
                                    : column === "name" ? "Nombre"
                                    : column === "percentage" ? "Porcentaje"
                                    : column === "average" ? "Promedio"
                                    : column === "impressions" ? "Total carritos"
                                    : column === "clicks" ? "Compras completadas"
                                    : column === "ctr" ? "Tasa abandono"
                                    : column === "addToCarts" ? "Añadidos al carrito"
                                    : column === "purchases" ? "Compras"
                                    : column === "abandoned" ? "Abandonados"
                                    : column === "revenue" ? "Ingresos"
                                    : column === "fullMark" ? "Valor máximo"
                                    : column === "actual" ? "Actual"
                                    : column === "anterior" ? "Anterior"
                                    : column === "variacion" ? "Variación %"
                                    : column === "tasaConversion" ? "Tasa Conversión %"
                                    : column === "compras" ? "Compras"
                                    : column === "abandonmentRate" ? "Tasa Abandono %"
                                    : column === "responses" ? "Respuestas"
                                    : column === "openRate" ? "Tasa Apertura %"
                                    : column === "clickRate" ? "Tasa Clics %"
                                    : column === "conversions" ? "Conversiones"
                                    : column === "campaign" ? "Campaña"
                                    : column === "sessions" ? "Sesiones"
                                    : column === "area" ? "Área"
                                    : column === "métrica" ? "Métrica"
                                    : column === "sugerencia" ? "Sugerencia"
                                    : column === "impactoEstimado" ? "Impacto Estimado"
                                    : column === "producto" ? "Producto"
                                    : column === "categoria" ? "Categoría"
                                    : column === "marca" ? "Marca"
                                    : column === "vistas" ? "Vistas"
                                    : column === "eventos" ? "Eventos"
                                    : column === "ingresos" ? "Ingresos"
                                    : column === "nombre" ? "Nombre"
                                    : column === "valor" ? "Valor"
                                    : column === "tasa" ? "Tasa %"
                                    : column}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {chartData.map((row, rowIndex) => (
                        <tr
                            key={rowIndex}
                            className="hover:bg-opacity-20 transition-colors"
                            style={{
                                backgroundColor: rowIndex % 2 === 0 ? `${colors.glass}40` : "transparent",
                                borderBottom: `1px solid ${colors.glass}`,
                            }}
                        >
                            {columns.map((column) => (
                                <td key={`${rowIndex}-${column}`} className="p-2">
                                    {typeof row[column] === "number"
                                        ? column.includes("revenue") ||
                                            column.includes("average") ||
                                            column.includes("ingresos") ||
                                            column === "actual" ||
                                            column === "anterior"
                                            ? formatCurrency(row[column])
                                            : column.includes("Rate") || column.includes("tasa") || column === "variacion" || column === "ctr"
                                                ? `${row[column].toFixed(2)}%`
                                                : row[column].toLocaleString()
                                        : row[column]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Render chart based on chart type
export const renderChart = (kpiKey: string, chartType: string, chartData: any[], activeTooltipIndex: number | null, setActiveTooltipIndex: Function) => {
    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-center" style={{ color: colors.text }}>
                    No hay datos disponibles para mostrar en el gráfico
                </p>
            </div>
        );
    }

    // Common chart props
    const chartProps = {
        id: `chart-${kpiKey}`,
        className: "chart-container",
        onClick: (data: any) => {
            if (data && data.activeTooltipIndex !== undefined) {
                setActiveTooltipIndex(data.activeTooltipIndex === activeTooltipIndex ? null : data.activeTooltipIndex);
            }
        },
    };

    switch (chartType) {
        case "bar":
            return (
                <ResponsiveContainer width="100%" height={400} {...chartProps}>
                    <BarChart data={chartData}>
                        <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                        <XAxis
                            dataKey={chartData[0]?.date ? "date" : "name"}
                            style={{ fill: colors.text }}
                            angle={chartData.length > 10 ? -45 : 0}
                            textAnchor={chartData.length > 10 ? "end" : "middle"}
                            height={chartData.length > 10 ? 80 : 30}
                        />
                        <YAxis style={{ fill: colors.text }} />
                        <Tooltip
                            {...tooltipStyle}
                            cursor={{ fill: colors.hoverHighlight }}
                            formatter={(value: number, name: string) => {
                                if (name === "value" || name === "average") {
                                    return [value.toLocaleString(), name === "value" ? "Valor" : "Promedio"];
                                }
                                if (name === "revenue" || name === "ingresos") {
                                    return [formatCurrency(value), name === "revenue" ? "Ingresos" : "Ingresos"];
                                }
                                if (name.includes("Rate") || name.includes("tasa") || name === "variacion") {
                                    return [`${value.toFixed(2)}%`, name];
                                }
                                if (name === "impressions") {
                                    return [value.toLocaleString(), "Total carritos"];
                                }
                                if (name === "clicks") {
                                    return [value.toLocaleString(), "Compras completadas"];
                                }
                                return [value.toLocaleString(), name];
                            }}
                        />
                        <Legend
                            wrapperStyle={{ color: colors.text }}
                            formatter={(value) => {
                                if (value === "value") return "Valor";
                                if (value === "average") return "Promedio";
                                if (value === "revenue") return "Ingresos";
                                if (value === "purchases") return "Compras";
                                if (value === "impressions") return "Total carritos";
                                if (value === "clicks") return "Compras completadas";
                                if (value === "addToCarts") return "Añadidos al carrito";
                                if (value === "abandoned") return "Abandonados";
                                if (value === "responses") return "Respuestas";
                                if (value === "actual") return "Actual";
                                if (value === "anterior") return "Anterior";
                                if (value === "variacion") return "Variación %";
                                return value;
                            }}
                        />
                        {kpiKey === "carrosAbandonados" ? (
                            <>
                                <Bar dataKey="impressions" name="Total carritos" fill={colors.primary} />
                                <Bar dataKey="clicks" name="Compras completadas" fill={colors.accent} />
                                <Bar dataKey="value" name="Carritos abandonados" fill={colors.danger} />
                            </>
                        ) : kpiKey === "comparativos" ? (
                            <>
                                <Bar dataKey="actual" name="Actual" fill={colors.accent} />
                                <Bar dataKey="anterior" name="Anterior" fill={colors.primary} />
                            </>
                        ) : (
                            <Bar
                                dataKey={
                                    chartData[0]?.average
                                        ? "average"
                                        : chartData[0]?.value
                                            ? "value"
                                            : chartData[0]?.responses
                                                ? "responses"
                                                : "value"
                                }
                                name={chartData[0]?.average ? "Ticket Promedio" : chartData[0]?.responses ? "Respuestas" : "Valor"}
                                fill={colors.accent}
                                radius={[4, 4, 0, 0]}
                                background={{ fill: "rgba(74, 227, 181, 0.05)" }}
                            />
                        )}
                    </BarChart>
                </ResponsiveContainer>
            );

        case "line":
            return (
                <ResponsiveContainer width="100%" height={400} {...chartProps}>
                    <LineChart data={chartData}>
                        <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                        <XAxis
                            dataKey={chartData[0]?.date ? "date" : "name"}
                            style={{ fill: colors.text }}
                            angle={chartData.length > 10 ? -45 : 0}
                            textAnchor={chartData.length > 10 ? "end" : "middle"}
                            height={chartData.length > 10 ? 80 : 30}
                        />
                        <YAxis style={{ fill: colors.text }} />
                        <Tooltip
                            {...tooltipStyle}
                            cursor={{ stroke: colors.accent, strokeWidth: 1 }}
                            formatter={(value: number, name: string) => {
                                if (name === "value" || name === "average") {
                                    return [value.toLocaleString(), name === "value" ? "Valor" : "Promedio"];
                                }
                                if (name === "revenue" || name === "ingresos" || name === "vtexRevenue") {
                                    return [
                                        formatCurrency(value),
                                        name === "vtexRevenue" ? "Ingresos VTEX" : name === "revenue" ? "Ingresos GA4" : "Ingresos",
                                    ];
                                }
                                if (name.includes("Rate") || name.includes("tasa") || name === "variacion") {
                                    return [`${value.toFixed(2)}%`, name];
                                }
                                if (name === "vtexAverage") {
                                    return [formatCurrency(value), "Ticket VTEX"];
                                }
                                if (name === "impressions") {
                                    return [value.toLocaleString(), "Total carritos"];
                                }
                                if (name === "clicks") {
                                    return [value.toLocaleString(), "Compras completadas"];
                                }
                                return [value.toLocaleString(), name];
                            }}
                        />
                        <Legend
                            wrapperStyle={{ color: colors.text }}
                            formatter={(value) => {
                                if (value === "value") return "Valor";
                                if (value === "average") return "Promedio GA4";
                                if (value === "vtexAverage") return "Promedio VTEX";
                                if (value === "revenue") return "Ingresos GA4";
                                if (value === "vtexRevenue") return "Ingresos VTEX";
                                if (value === "purchases") return "Compras GA4";
                                if (value === "vtexPurchases") return "Compras VTEX";
                                if (value === "impressions") return "Total carritos";
                                if (value === "clicks") return "Compras completadas";
                                if (value === "addToCarts") return "Añadidos al carrito";
                                if (value === "abandoned") return "Abandonados";
                                if (value === "openRate") return "Tasa Apertura";
                                if (value === "clickRate") return "Tasa Clics";
                                if (value === "conversions") return "Conversiones";
                                return value;
                            }}
                        />
                        {kpiKey === "ticketPromedioDelMes" && chartData[0]?.vtexAverage ? (
                            <>
                                <Line
                                    type="monotone"
                                    dataKey="average"
                                    name="Promedio GA4"
                                    stroke={colors.accent}
                                    strokeWidth={2}
                                    dot={{ fill: colors.secondary, stroke: colors.accent, strokeWidth: 2, r: 4 }}
                                    activeDot={{ fill: colors.accent, stroke: colors.secondary, strokeWidth: 2, r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="vtexAverage"
                                    name="Promedio VTEX"
                                    stroke={colors.warning}
                                    strokeWidth={2}
                                    dot={{ fill: colors.secondary, stroke: colors.warning, strokeWidth: 2, r: 4 }}
                                    activeDot={{ fill: colors.warning, stroke: colors.secondary, strokeWidth: 2, r: 6 }}
                                    strokeDasharray="5 5"
                                />
                            </>
                        ) : kpiKey === "carrosAbandonados" ? (
                            <>
                                <Line
                                    type="monotone"
                                    dataKey="impressions"
                                    name="Total carritos"
                                    stroke={colors.primary}
                                    strokeWidth={2}
                                    dot={{ fill: colors.secondary, stroke: colors.primary, strokeWidth: 2, r: 4 }}
                                    activeDot={{ fill: colors.primary, stroke: colors.secondary, strokeWidth: 2, r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="clicks"
                                    name="Compras completadas"
                                    stroke={colors.accent}
                                    strokeWidth={2}
                                    dot={{ fill: colors.secondary, stroke: colors.accent, strokeWidth: 2, r: 4 }}
                                    activeDot={{ fill: colors.accent, stroke: colors.secondary, strokeWidth: 2, r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    name="Carritos abandonados"
                                    stroke={colors.danger}
                                    strokeWidth={2}
                                    dot={{ fill: colors.secondary, stroke: colors.danger, strokeWidth: 2, r: 4 }}
                                    activeDot={{ fill: colors.danger, stroke: colors.secondary, strokeWidth: 2, r: 6 }}
                                />
                            </>
                        ) : kpiKey === "tasaAperturaMails" ? (
                            <>
                                <Line
                                    type="monotone"
                                    dataKey="openRate"
                                    name="Tasa Apertura"
                                    stroke={colors.accent}
                                    strokeWidth={2}
                                    dot={{ fill: colors.secondary, stroke: colors.accent, strokeWidth: 2, r: 4 }}
                                    activeDot={{ fill: colors.accent, stroke: colors.secondary, strokeWidth: 2, r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="clickRate"
                                    name="Tasa Clics"
                                    stroke={colors.primary}
                                    strokeWidth={2}
                                    dot={{ fill: colors.secondary, stroke: colors.primary, strokeWidth: 2, r: 4 }}
                                    activeDot={{ fill: colors.primary, stroke: colors.secondary, strokeWidth: 2, r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="conversions"
                                    name="Conversiones"
                                    stroke={colors.warning}
                                    strokeWidth={2}
                                    dot={{ fill: colors.secondary, stroke: colors.warning, strokeWidth: 2, r: 4 }}
                                    activeDot={{ fill: colors.warning, stroke: colors.secondary, strokeWidth: 2, r: 6 }}
                                />
                            </>
                        ) : (
                            <Line
                                type="monotone"
                                dataKey={
                                    chartData[0]?.average
                                        ? "average"
                                        : chartData[0]?.value
                                            ? "value"
                                            : chartData[0]?.abandonmentRate
                                                ? "abandonmentRate"
                                                : "value"
                                }
                                name={
                                    chartData[0]?.average
                                        ? "Ticket Promedio"
                                        : chartData[0]?.abandonmentRate
                                            ? "Tasa de Abandono"
                                            : "Valor"
                                }
                                stroke={colors.accent}
                                strokeWidth={2}
                                dot={{ fill: colors.secondary, stroke: colors.accent, strokeWidth: 2, r: 4 }}
                                activeDot={{ fill: colors.accent, stroke: colors.secondary, strokeWidth: 2, r: 6 }}
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            );

        case "pie":
            return (
                <ResponsiveContainer width="100%" height={400} {...chartProps}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={160}
                            fill="#8884d8"
                            labelLine={false}
                            activeIndex={activeTooltipIndex}
                            activeShape={renderActiveShape}
                            animationDuration={500}
                            onClick={(_, index) => setActiveTooltipIndex(index === activeTooltipIndex ? null : index)}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors.chartColors[index % colors.chartColors.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={renderCustomizedPieTooltip} {...tooltipStyle} />
                        <Legend
                            wrapperStyle={{ color: colors.text }}
                            formatter={(value) => (value === "value" ? "Valor" : value)}
                        />
                    </PieChart>
                </ResponsiveContainer>
            );

        case "area":
            return (
                <ResponsiveContainer width="100%" height={400} {...chartProps}>
                    <AreaChart data={chartData}>
                        <defs>
                            {kpiKey === "carrosAbandonados" ? (
                                <>
                                    <linearGradient id="colorAddToCarts" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={colors.accent} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={colors.accent} stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="colorAbandoned" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={colors.danger} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={colors.danger} stopOpacity={0.1} />
                                    </linearGradient>
                                </>
                            ) : (
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={colors.accent} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={colors.accent} stopOpacity={0.1} />
                                </linearGradient>
                            )}
                        </defs>
                        <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                        <XAxis
                            dataKey={chartData[0]?.date ? "date" : "name"}
                            style={{ fill: colors.text }}
                            angle={chartData.length > 10 ? -45 : 0}
                            textAnchor={chartData.length > 10 ? "end" : "middle"}
                            height={chartData.length > 10 ? 80 : 30}
                        />
                        <YAxis style={{ fill: colors.text }} />
                        <Tooltip
                            {...tooltipStyle}
                            cursor={{ stroke: colors.accent, strokeWidth: 1 }}
                            formatter={(value: number, name: string) => {
                                if (name === "value" || name === "average") {
                                    return [value.toLocaleString(), name === "value" ? "Valor" : "Promedio"];
                                }
                                if (name === "revenue" || name === "ingresos") {
                                    return [formatCurrency(value), name === "revenue" ? "Ingresos" : "Ingresos"];
                                }
                                if (name.includes("Rate") || name.includes("tasa") || name === "variacion") {
                                    return [`${value.toFixed(2)}%`, name];
                                }
                                if (name === "impressions") {
                                    return [value.toLocaleString(), "Total carritos"];
                                }
                                if (name === "clicks") {
                                    return [value.toLocaleString(), "Compras completadas"];
                                }
                                return [value.toLocaleString(), name];
                            }}
                        />
                        <Legend
                            wrapperStyle={{ color: colors.text }}
                            formatter={(value) => {
                                if (value === "value") return "Valor";
                                if (value === "average") return "Promedio";
                                if (value === "revenue") return "Ingresos";
                                if (value === "purchases") return "Compras";
                                if (value === "impressions") return "Total carritos";
                                if (value === "clicks") return "Compras completadas";
                                if (value === "addToCarts") return "Añadidos al carrito";
                                if (value === "abandoned") return "Abandonados";
                                return value;
                            }}
                        />
                        {kpiKey === "carrosAbandonados" ? (
                            <>
                                <Area
                                    type="monotone"
                                    dataKey="impressions"
                                    name="Total carritos"
                                    stroke={colors.primary}
                                    fillOpacity={1}
                                    fill="url(#colorAddToCarts)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="clicks"
                                    name="Compras completadas"
                                    stroke={colors.accent}
                                    fillOpacity={1}
                                    fill="url(#colorPurchases)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    name="Carritos abandonados"
                                    stroke={colors.danger}
                                    fillOpacity={1}
                                    fill="url(#colorAbandoned)"
                                />
                            </>
                        ) : (
                            <Area
                                type="monotone"
                                dataKey={chartData[0]?.average ? "average" : chartData[0]?.value ? "value" : "value"}
                                name={chartData[0]?.average ? "Ticket Promedio" : "Valor"}
                                stroke={colors.accent}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            );

        case "radar":
            return (
                <ResponsiveContainer width="100%" height={400} {...chartProps}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                        <PolarGrid stroke={colors.grid} />
                        <PolarAngleAxis dataKey="name" tick={{ fill: colors.text, fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, "auto"]} tick={{ fill: colors.text, fontSize: 12 }} />
                        <Radar name="Valor" dataKey="value" stroke={colors.accent} fill={colors.accent} fillOpacity={0.6} />
                        {chartData[0]?.fullMark && (
                            <Radar
                                name="Máximo"
                                dataKey="fullMark"
                                stroke={colors.primary}
                                fill={colors.primary}
                                fillOpacity={0.1}
                            />
                        )}
                        <Legend
                            wrapperStyle={{ color: colors.text }}
                            formatter={(value) => (value === "value" ? "Valor" : value)}
                        />
                        <Tooltip {...tooltipStyle} />
                    </RadarChart>
                </ResponsiveContainer>
            );

        case "funnel":
            return (
                <ResponsiveContainer width="100%" height={400} {...chartProps}>
                    <FunnelChart>
                        <Tooltip
                            {...tooltipStyle}
                            formatter={(value: number, name: string, props: any) => {
                                if (name === "valor") {
                                    return [value.toLocaleString(), "Cantidad"];
                                }
                                if (name === "tasa") {
                                    return [`${value.toFixed(2)}%`, "Tasa"];
                                }
                                return [value.toLocaleString(), name];
                            }}
                        />
                        <Funnel dataKey="valor" data={chartData} nameKey="nombre" fill={colors.accent}>
                            <LabelList position="right" fill={colors.text} stroke="none" dataKey="nombre" />
                            <LabelList
                                position="left"
                                fill={colors.text}
                                stroke="none"
                                dataKey={(entry: any) => `${entry.valor.toLocaleString()}`}
                            />
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors.chartColors[index % colors.chartColors.length]} />
                            ))}
                        </Funnel>
                    </FunnelChart>
                </ResponsiveContainer>
            );

        case "composed":
            if (kpiKey === "inversionMarketing" || kpiKey === "campañas") {
                return (
                    <ResponsiveContainer width="100%" height={400} {...chartProps}>
                        <ComposedChart data={chartData}>
                            <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                            <XAxis dataKey="campaign" style={{ fill: colors.text }} angle={-45} textAnchor="end" height={80} />
                            <YAxis yAxisId="left" style={{ fill: colors.text }} />
                            <YAxis yAxisId="right" orientation="right" style={{ fill: colors.text }} />
                            <Tooltip
                                {...tooltipStyle}
                                formatter={(value: number, name: string) => {
                                    if (name === "sessions") {
                                        return [value.toLocaleString(), "Sesiones"];
                                    }
                                    if (name === "purchases") {
                                        return [value.toLocaleString(), "Compras"];
                                    }
                                    if (name === "revenue") {
                                        return [formatCurrency(value), "Ingresos"];
                                    }
                                    if (name === "conversionRate") {
                                        return [`${value.toFixed(2)}%`, "Tasa Conversión"];
                                    }
                                    return [value.toLocaleString(), name];
                                }}
                            />
                            <Legend
                                wrapperStyle={{ color: colors.text }}
                                formatter={(value) => {
                                    if (value === "sessions") return "Sesiones";
                                    if (value === "purchases") return "Compras";
                                    if (value === "revenue") return "Ingresos";
                                    if (value === "conversionRate") return "Tasa Conversión";
                                    return value;
                                }}
                            />
                            <Bar yAxisId="left" dataKey="sessions" name="Sesiones" fill={colors.primary} />
                            <Bar yAxisId="left" dataKey="purchases" name="Compras" fill={colors.accent} />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="conversionRate"
                                name="Tasa Conversión"
                                stroke={colors.warning}
                                strokeWidth={2}
                                dot={{ fill: colors.secondary, stroke: colors.warning, strokeWidth: 2, r: 4 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                );
            } else if (kpiKey === "tasaAperturaMails") {
                return (
                    <ResponsiveContainer width="100%" height={400} {...chartProps}>
                        <ComposedChart data={chartData}>
                            <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                style={{ fill: colors.text }}
                                angle={chartData.length > 10 ? -45 : 0}
                                textAnchor={chartData.length > 10 ? "end" : "middle"}
                                height={chartData.length > 10 ? 80 : 30}
                            />
                            <YAxis yAxisId="left" style={{ fill: colors.text }} />
                            <YAxis yAxisId="right" orientation="right" style={{ fill: colors.text }} />
                            <Tooltip
                                {...tooltipStyle}
                                formatter={(value: number, name: string) => {
                                    if (name === "openRate" || name === "clickRate") {
                                        return [`${value.toFixed(2)}%`, name === "openRate" ? "Tasa Apertura" : "Tasa Clics"];
                                    }
                                    if (name === "conversions") {
                                        return [value.toLocaleString(), "Conversiones"];
                                    }
                                    return [value.toLocaleString(), name];
                                }}
                            />
                            <Legend
                                wrapperStyle={{ color: colors.text }}
                                formatter={(value) => {
                                    if (value === "openRate") return "Tasa Apertura";
                                    if (value === "clickRate") return "Tasa Clics";
                                    if (value === "conversions") return "Conversiones";
                                    return value;
                                }}
                            />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="openRate"
                                name="Tasa Apertura"
                                stroke={colors.accent}
                                strokeWidth={2}
                                dot={{ fill: colors.secondary, stroke: colors.accent, strokeWidth: 2, r: 4 }}
                            />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="clickRate"
                                name="Tasa Clics"
                                stroke={colors.primary}
                                strokeWidth={2}
                                dot={{ fill: colors.secondary, stroke: colors.primary, strokeWidth: 2, r: 4 }}
                            />
                            <Bar yAxisId="right" dataKey="conversions" name="Conversiones" fill={colors.warning} />
                        </ComposedChart>
                    </ResponsiveContainer>
                );
            }
            return (
                <div className="flex items-center justify-center h-full">
                    <p className="text-center" style={{ color: colors.text }}>
                        Tipo de gráfico compuesto no disponible para este KPI
                    </p>
                </div>
            );

        case "treemap":
            return (
                <ResponsiveContainer width="100%" height={400} {...chartProps}>
                    <Treemap
                        data={chartData}
                        dataKey="value"
                        nameKey={
                            chartData[0]?.name
                                ? "name"
                                : chartData[0]?.producto
                                    ? "producto"
                                    : chartData[0]?.categoria
                                        ? "categoria"
                                        : chartData[0]?.marca
                                            ? "marca"
                                            : chartData[0]?.area
                                                ? "area"
                                                : "name"
                        }
                        aspectRatio={4 / 3}
                        stroke={colors.secondary}
                        fill={colors.accent}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors.chartColors[index % colors.chartColors.length]} />
                        ))}
                        <Tooltip
                            {...tooltipStyle}
                            formatter={(value: number, name: string, props: any) => {
                                const entry = props.payload;
                                const items = [];

                                if (entry.name) {
                                    items.push([entry.name, "Nombre"]);
                                }
                                if (entry.value) {
                                    items.push([entry.value.toLocaleString(), "Valor"]);
                                }
                                if (entry.tasaConversion) {
                                    items.push([`${entry.tasaConversion.toFixed(2)}%`, "Conversión"]);
                                }
                                if (entry.compras) {
                                    items.push([entry.compras.toLocaleString(), "Compras"]);
                                }
                                if (entry.sugerencia) {
                                    items.push([entry.sugerencia, "Sugerencia"]);
                                }
                                if (entry.impactoEstimado) {
                                    items.push([entry.impactoEstimado, "Impacto"]);
                                }

                                return items;
                            }}
                        />
                    </Treemap>
                </ResponsiveContainer>
            );

        default:
            return (
                <div className="flex items-center justify-center h-full">
                    <p className="text-center" style={{ color: colors.text }}>
                        Tipo de gráfico no soportado
                    </p>
                </div>
            );
    }
};