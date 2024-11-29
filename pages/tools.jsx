import { useSession } from "next-auth/react";
import React, { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart, LineChart, BarChart, PieChart, RadarChart,
  Line, Bar, Pie, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';
import {
  Settings, BarChart3, PieChart as PieIcon, LineChart as LineIcon,
  Hexagon, SplitSquareHorizontal, Layers
} from 'lucide-react';
import Puntos from "../utils/puntos";
import SapO2 from "../components/sapO2";
import SapO3 from "../components/sapO3";
import FedEx from "../components/fedEx";
import MeliTools from "../components/meli_tools";
import MeliTable from "../components/meli_table";
import SyncFramer from "../components/syncFramer";
import { useRouter } from "next/router";
import OrdersVentusComp from "../components/ordersVentusComp";
import Febos from "../components/febos";
import ConsultaStockComponent from "../components/ConsultaStockSAPTable";



const AdaptiveChart = ({ data = [], width }) => {
  // Utilizamos useMemo para calcular la configuración inicial
  const initialConfig = useMemo(() => {
    const dataLength = data.length;
    const numericKeys = Object.keys(data[0] || {}).filter(
      key => typeof data[0]?.[key] === 'number' && key !== 'id'
    );

    if (dataLength <= 3 && numericKeys.length === 1) {
      return {
        type: 'pie',
        config: {
          dataKey: numericKeys[0],
          nameKey: Object.keys(data[0] || {}).find(
            key => typeof data[0]?.[key] === 'string'
          )
        }
      };
    } else if (dataLength > 15) {
      return {
        type: 'line',
        config: {
          dataKeys: numericKeys
        }
      };
    }
    return {
      type: 'bar',
      config: {
        dataKeys: numericKeys
      }
    };
  }, [data]);

  // Establecemos el estado inicial usando los valores calculados
  const [chartConfig, setChartConfig] = useState(initialConfig);

  // Actualizamos la configuración solo cuando cambian los datos o el ancho
  useEffect(() => {
    setChartConfig(initialConfig);
  }, [initialConfig]);

  const renderChart = () => {
    const { type, config } = chartConfig;

    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {config.dataKeys?.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={`hsl(${(index * 360) / config.dataKeys.length}, 70%, 50%)`}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {config.dataKeys?.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={`hsl(${(index * 360) / config.dataKeys.length}, 70%, 50%)`}
              />
            ))}
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={config.dataKey}
              nameKey={config.nameKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label
            />
            <Tooltip />
            <Legend />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[600px] p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <ResponsiveContainer>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const SmartMultiModalChart = ({ data = [] }) => {
  // Paleta de colores moderna y neón suave
  const colorPalette = {
    neon: {
      blue: 'rgba(45, 216, 255, 0.85)',     // Neón azul suave
      purple: 'rgba(162, 89, 255, 0.85)',    // Neón púrpura suave
      pink: 'rgba(255, 89, 255, 0.85)',      // Neón rosa suave
      cyan: 'rgba(89, 255, 255, 0.85)',      // Neón cyan suave
      green: 'rgba(89, 255, 169, 0.85)'      // Neón verde suave
    },
    solid: {
      blue: 'rgba(66, 153, 225, 0.85)',      // Azul sólido
      purple: 'rgba(159, 122, 234, 0.85)',    // Púrpura sólido
      green: 'rgba(72, 187, 120, 0.85)',      // Verde sólido
      orange: 'rgba(237, 137, 54, 0.85)',     // Naranja sólido
      pink: 'rgba(237, 100, 166, 0.85)'       // Rosa sólido
    }
  };

  const chartConfig = useMemo(() => {
    if (!data.length || !data[0]) return { barKeys: [], lineKeys: [] };

    const numericKeys = Object.keys(data[0]).filter(key =>
      typeof data[0][key] === 'number' && key !== 'id'
    );

    const seriesAnalysis = numericKeys.map(key => {
      const variations = data.slice(1).map((item, index) =>
        Math.abs(item[key] - data[index][key])
      );

      const avgVariation = variations.reduce((a, b) => a + b, 0) / variations.length;
      const stdDev = Math.sqrt(
        variations.reduce((a, b) => a + Math.pow(b - avgVariation, 2), 0) / variations.length
      );
      const variationCoeff = stdDev / avgVariation;

      return {
        key,
        variationCoeff,
        shouldBeLine: variationCoeff < 0.5
      };
    });

    return {
      lineKeys: seriesAnalysis.filter(s => s.shouldBeLine).map(s => s.key),
      barKeys: seriesAnalysis.filter(s => !s.shouldBeLine).map(s => s.key)
    };
  }, [data]);

  const getSeriesStyle = (index, type, total) => {
    const colors = type === 'line' ? colorPalette.neon : colorPalette.solid;
    const colorKeys = Object.keys(colors);
    const color = colors[colorKeys[index % colorKeys.length]];

    if (type === 'line') {
      return {
        stroke: color,
        strokeWidth: 2,
        filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.3))'
      };
    }

    return {
      fill: color,
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
    };
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-700">
          <p className="text-gray-200 font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!data.length) return null;

  return (
    <div className="w-full h-full min-h-[400px] bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800/50 shadow-2xl">
      <ResponsiveContainer>
        <ComposedChart
          data={data}
          className="filter drop-shadow-lg"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.1)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            stroke="rgba(255,255,255,0.6)"
            fontSize={12}
          />
          <YAxis
            stroke="rgba(255,255,255,0.6)"
            fontSize={12}
            tickFormatter={value => value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              opacity: 0.8
            }}
          />

          {chartConfig.barKeys.map((key, index) => (
            <Bar
              key={`bar-${key}`}
              dataKey={key}
              {...getSeriesStyle(index, 'bar', chartConfig.barKeys.length)}
              radius={[4, 4, 0, 0]}
            />
          ))}

          {chartConfig.lineKeys.map((key, index) => (
            <Line
              key={`line-${key}`}
              type="monotone"
              dataKey={key}
              {...getSeriesStyle(index, 'line', chartConfig.lineKeys.length)}
              dot={{
                stroke: colorPalette.neon[Object.keys(colorPalette.neon)[index % 5]],
                strokeWidth: 2,
                r: 4,
                fill: '#1a1a1a'
              }}
              activeDot={{
                r: 6,
                stroke: '#fff',
                strokeWidth: 2
              }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

const SmartMultiModalModernChart = ({ data = [] }) => {
  const [forceChartType, setForceChartType] = useState(null);
  const [showControls, setShowControls] = useState(false);
  const [isIndividualMode, setIsIndividualMode] = useState(false);

  // Paleta de colores moderna y neón suave
  const colorPalette = {
    neon: {
      blue: 'rgba(45, 216, 255, 0.85)',     // Neón azul suave
      purple: 'rgba(162, 89, 255, 0.85)',   // Neón púrpura suave
      pink: 'rgba(255, 89, 255, 0.85)',     // Neón rosa suave
      cyan: 'rgba(89, 255, 255, 0.85)',     // Neón cyan suave
      green: 'rgba(89, 255, 169, 0.85)'     // Neón verde suave
    },
    solid: {
      blue: 'rgba(66, 153, 225, 0.85)',     // Azul sólido
      purple: 'rgba(159, 122, 234, 0.85)',  // Púrpura sólido
      green: 'rgba(72, 187, 120, 0.85)',    // Verde sólido
      orange: 'rgba(237, 137, 54, 0.85)',   // Naranja sólido
      pink: 'rgba(237, 100, 166, 0.85)'     // Rosa sólido
    }
  };

  // Función para estilos de series
  const getSeriesStyle = (index, type, total) => {
    const colors = type === 'line' ? colorPalette.neon : colorPalette.solid;
    const colorKeys = Object.keys(colors);
    const color = colors[colorKeys[index % colorKeys.length]];

    if (type === 'line') {
      return {
        stroke: color,
        strokeWidth: 2,
        filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.3))'
      };
    }

    return {
      fill: color,
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
    };
  };

  // Tooltip personalizado con estilos de glassmorphism
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-700">
          <p className="text-gray-200 font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Manejo de teclas
  const handleKeyDown = (event) => {
    if (event.shiftKey) setForceChartType('pie');
    if (event.key === 'L') setForceChartType('line');
    if (event.key === 'B') setForceChartType('bar');
    if (event.key === 'R') setForceChartType('radar');
  };

  const handleKeyUp = () => setForceChartType(null);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Configuración del gráfico con análisis de datos
  const chartConfig = useMemo(() => {
    if (!data.length || !data[0]) return { barKeys: [], lineKeys: [], type: 'bar' };

    const numericKeys = Object.keys(data[0]).filter(key =>
      typeof data[0][key] === 'number' && key !== 'id'
    );

    const seriesAnalysis = numericKeys.map(key => {
      const variations = data.slice(1).map((item, index) =>
        Math.abs(item[key] - data[index][key])
      );

      const avgVariation = variations.reduce((a, b) => a + b, 0) / (variations.length || 1);
      const stdDev = Math.sqrt(
        variations.reduce((a, b) => a + Math.pow(b - avgVariation, 2), 0) / (variations.length || 1)
      );
      const variationCoeff = avgVariation ? stdDev / avgVariation : 0;

      return {
        key,
        variationCoeff,
        shouldBeLine: variationCoeff < 0.5
      };
    });

    const lineKeys = seriesAnalysis.filter(s => s.shouldBeLine).map(s => s.key);
    const barKeys = seriesAnalysis.filter(s => !s.shouldBeLine).map(s => s.key);

    let suggestedType = forceChartType || 'composed';
    if (!forceChartType) {
      if (data.length <= 3 && numericKeys.length === 1) {
        suggestedType = 'pie';
      } else if (data.length > 15) {
        suggestedType = 'line';
      }
    }

    return {
      type: suggestedType,
      lineKeys,
      barKeys,
      keys: numericKeys,
    };
  }, [data, forceChartType]);

  // Controles
  const Controls = () => (
    <div className="absolute z-50 top-4 right-4 flex flex-col gap-3">
      <button
        onClick={() => setShowControls(!showControls)}
        className="p-2 rounded-lg bg-gray-800/50 backdrop-blur-md hover:bg-gray-700/50 transition-all"
      >
        <Settings className="w-5 h-5 text-gray-200" />
      </button>

      {showControls && (
        <div className="flex flex-col gap-3 p-4 rounded-lg bg-gray-800/70 backdrop-blur-sm shadow-xl">
          <div className="flex gap-2">
            <button
              onClick={() => setForceChartType('bar')}
              className={`p-2 rounded-lg ${forceChartType === 'bar' ? 'bg-gray-700/50' : 'hover:bg-gray-700/30'
                }`}
            >
              <BarChart3 className="w-5 h-5 text-gray-200" />
            </button>
            <button
              onClick={() => setForceChartType('pie')}
              className={`p-2 rounded-lg ${forceChartType === 'pie' ? 'bg-gray-700/50' : 'hover:bg-gray-700/30'
                }`}
            >
              <PieIcon className="w-5 h-5 text-gray-200" />
            </button>
            <button
              onClick={() => setForceChartType('line')}
              className={`p-2 rounded-lg ${forceChartType === 'line' ? 'bg-gray-700/50' : 'hover:bg-gray-700/30'
                }`}
            >
              <LineIcon className="w-5 h-5 text-gray-200" />
            </button>
            <button
              onClick={() => setForceChartType('radar')}
              className={`p-2 rounded-lg ${forceChartType === 'radar' ? 'bg-gray-700/50' : 'hover:bg-gray-700/30'
                }`}
            >
              <Hexagon className="w-5 h-5 text-gray-200" />
            </button>
          </div>
          <div className="flex justify-between items-center">
            <button
              onClick={() => setIsIndividualMode(!isIndividualMode)}
              className={`p-2 w-10 h-10 flex items-center justify-center rounded-full bg-gray-800/60 hover:bg-gray-700/60 transition-all ${isIndividualMode ? 'rotate-180' : ''
                }`}
              style={{
                transform: `rotate(${isIndividualMode ? '180deg' : '0deg'})`,
                transition: 'transform 0.3s ease-in-out',
              }}
            >
              <SplitSquareHorizontal
                className="w-5 h-5 text-gray-200"
                style={{ transition: 'all 0.3s ease-in-out' }}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Renderizado del gráfico
  const renderChart = () => {
    const chartType = chartConfig.type;
    // Definir un estilo personalizado para las barras
    const barStyle = {
      cursor: 'pointer', // Opcional: Cambia el cursor al pasar por encima
      fillOpacity: 1,    // Asegura que la opacidad no cambie
    };


    if (isIndividualMode) {
      // Modo individual
      switch (chartType) {
        case 'pie':
          return (
            <PieChart>
              <Pie
                data={data}
                dataKey={chartConfig.keys[0]}
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                fill={colorPalette.neon.blue}
                label
                className="drop-shadow-xl"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colorPalette.neon[Object.keys(colorPalette.neon)[index % 5]]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          );

        case 'line':
          return (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={12} />
              <YAxis
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {chartConfig.keys.map((key, index) => (
                <Line
                  key={`line-${key}`}
                  type="monotone"
                  dataKey={key}
                  {...getSeriesStyle(index, 'line', chartConfig.keys.length)}
                />
              ))}
            </LineChart>
          );

        case 'radar':
          return (
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="name" stroke="rgba(255,255,255,0.6)" />
              <PolarRadiusAxis stroke="rgba(255,255,255,0.6)" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {chartConfig.keys.map((key, index) => (
                <Radar
                  key={key}
                  name={key}
                  dataKey={key}
                  stroke={colorPalette.neon[Object.keys(colorPalette.neon)[index % 5]]}
                  fill={colorPalette.neon[Object.keys(colorPalette.neon)[index % 5]]}
                  fillOpacity={0.6}
                  className="drop-shadow-lg"
                />
              ))}
            </RadarChart>
          );

        default:
          return (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" opacity={0.5}/>
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.1)" fontSize={12} />
              <YAxis
                stroke="rgba(255,255,255,0.1)"
                fontSize={12}
                tickFormatter={(value) => value.toLocaleString()}
                
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {chartConfig.keys.map((key, index) => (

                <Bar
                  key={`bar-${key}`}
                  dataKey={key}
                  {...getSeriesStyle(index, 'bar', chartConfig.barKeys.length)}
                  radius={[4, 4, 0, 0]}

                />
              ))}
            </BarChart>
          );
      }
    } else {
      // Modo combinado
      return (
        <ComposedChart data={data} className="filter drop-shadow-lg">
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.1)"
            vertical={false}
          />
          <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={12} />
          <YAxis
            stroke="rgba(255,255,255,0.6)"
            fontSize={12}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              opacity: 0.8
            }}
          />
          {chartConfig.barKeys.map((key, index) => (
            <Bar
              key={`bar-${key}`}
              dataKey={key}
              {...getSeriesStyle(index, 'bar', chartConfig.barKeys.length)}
              radius={[4, 4, 0, 0]}
            />
          ))}
          {chartConfig.lineKeys.map((key, index) => (
            <Line
              key={`line-${key}`}
              type="monotone"
              dataKey={key}
              {...getSeriesStyle(index, 'line', chartConfig.lineKeys.length)}
              dot={{
                stroke: colorPalette.neon[Object.keys(colorPalette.neon)[index % 5]],
                strokeWidth: 2,
                r: 4,
                fill: '#1a1a1a'
              }}
              activeDot={{
                r: 6,
                stroke: '#fff',
                strokeWidth: 2
              }}
            />
          ))}
        </ComposedChart>
      );
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50 shadow-2xl">
      <Controls />
      <ResponsiveContainer>{renderChart()}</ResponsiveContainer>
    </div>
  );
};



const Testeo = () => {
  const { data: session } = useSession();
  const [chartData, setChartData] = useState([
    { name: 'Enero', ventas: 4000, beneficio: 2400 },
    { name: 'Febrero', ventas: 3000, beneficio: 1398 },
    { name: 'Marzo', ventas: 2000, beneficio: 9800 }
  ]); // Datos iniciales por defecto

  const dataMixto = [
    { name: 'Ene', ventas: 4000, costos: 2400, tendencia: 3500, pronostico: 3800 },
    { name: 'Feb', ventas: 4200, costos: 2500, tendencia: 3600, pronostico: 3900 },
    { name: 'Mar', ventas: 4800, costos: 2800, tendencia: 3700, pronostico: 4000 },
    { name: 'Abr', ventas: 4600, costos: 2700, tendencia: 3800, pronostico: 4100 },
    { name: 'May', ventas: 5000, costos: 2900, tendencia: 3900, pronostico: 4200 },
    { name: 'Jun', ventas: 5200, costos: 3000, tendencia: 4000, pronostico: 4300 },
  ];

  const dataMixtoComplejo = [
    {
      name: 'Ene',
      ventas_totales: 145000,
      costos_operativos: 89000,
      margen_beneficio: 38.62,
      tendencia_mercado: 102,
      prediccion_demanda: 148000,
      tasa_conversion: 2.8,
      visitantes: 45000,
      tickets_promedio: 3220,
      satisfaccion_cliente: 94.2
    },
    {
      name: 'Feb',
      ventas_totales: 162000,
      costos_operativos: 92000,
      margen_beneficio: 43.21,
      tendencia_mercado: 105,
      prediccion_demanda: 165000,
      tasa_conversion: 3.1,
      visitantes: 52000,
      tickets_promedio: 3115,
      satisfaccion_cliente: 93.8
    },
    {
      name: 'Mar',
      ventas_totales: 158000,
      costos_operativos: 94500,
      margen_beneficio: 40.19,
      tendencia_mercado: 108,
      prediccion_demanda: 170000,
      tasa_conversion: 2.9,
      visitantes: 48000,
      tickets_promedio: 3290,
      satisfaccion_cliente: 95.1
    },
    {
      name: 'Abr',
      ventas_totales: 175000,
      costos_operativos: 96000,
      margen_beneficio: 45.14,
      tendencia_mercado: 112,
      prediccion_demanda: 178000,
      tasa_conversion: 3.4,
      visitantes: 55000,
      tickets_promedio: 3180,
      satisfaccion_cliente: 94.7
    },
    {
      name: 'May',
      ventas_totales: 188000,
      costos_operativos: 98500,
      margen_beneficio: 47.61,
      tendencia_mercado: 115,
      prediccion_demanda: 185000,
      tasa_conversion: 3.6,
      visitantes: 58000,
      tickets_promedio: 3240,
      satisfaccion_cliente: 95.4
    },
    {
      name: 'Jun',
      ventas_totales: 195000,
      costos_operativos: 99000,
      margen_beneficio: 49.23,
      tendencia_mercado: 118,
      prediccion_demanda: 192000,
      tasa_conversion: 3.8,
      visitantes: 61000,
      tickets_promedio: 3195,
      satisfaccion_cliente: 96.2
    },
    {
      name: 'Jul',
      ventas_totales: 205000,
      costos_operativos: 101000,
      margen_beneficio: 50.73,
      tendencia_mercado: 122,
      prediccion_demanda: 208000,
      tasa_conversion: 4.0,
      visitantes: 64000,
      tickets_promedio: 3205,
      satisfaccion_cliente: 96.8
    },
    {
      name: 'Ago',
      ventas_totales: 201000,
      costos_operativos: 100500,
      margen_beneficio: 50.00,
      tendencia_mercado: 125,
      prediccion_demanda: 215000,
      tasa_conversion: 3.9,
      visitantes: 62000,
      tickets_promedio: 3240,
      satisfaccion_cliente: 95.9
    }
  ];

  const dataBar = [
    { name: 'Lunes', ventas: 4000, visitas: 2400, conversiones: 1800 },
    { name: 'Martes', ventas: 3500, visitas: 2100, conversiones: 1600 },
    { name: 'Miércoles', ventas: 5000, visitas: 3200, conversiones: 2100 },
    { name: 'Jueves', ventas: 4800, visitas: 2900, conversiones: 1900 },
    { name: 'Viernes', ventas: 6000, visitas: 3800, conversiones: 2400 },
    { name: 'Sábado', ventas: 3800, visitas: 2200, conversiones: 1500 },
    { name: 'Domingo', ventas: 2800, visitas: 1800, conversiones: 1200 }
  ];

  const dataLine = [
    { name: '1', valor: 4000, tendencia: 2400 },
    { name: '2', valor: 3800, tendencia: 2500 },
    { name: '3', valor: 4200, tendencia: 2600 },
    { name: '4', valor: 4100, tendencia: 2550 },
    { name: '5', valor: 4400, tendencia: 2700 },
    { name: '6', valor: 4300, tendencia: 2800 },
    { name: '7', valor: 4500, tendencia: 2900 },
    { name: '8', valor: 4450, tendencia: 3000 },
    { name: '9', valor: 4600, tendencia: 3100 },
    { name: '10', valor: 4700, tendencia: 3200 },
    { name: '11', valor: 4800, tendencia: 3300 },
    { name: '12', valor: 4900, tendencia: 3400 },
    { name: '13', valor: 5000, tendencia: 3500 },
    { name: '14', valor: 5100, tendencia: 3600 },
    { name: '15', valor: 5200, tendencia: 3700 },
    { name: '16', valor: 5300, tendencia: 3800 },
    { name: '17', valor: 5400, tendencia: 3900 },
    { name: '18', valor: 5500, tendencia: 4000 },
    { name: '19', valor: 5600, tendencia: 4100 },
    { name: '20', valor: 5700, tendencia: 4200 }
  ];

  const dataMonthly = [
    { name: 'Ene', ventas: 4000, costos: 2400, beneficio: 1600 },
    { name: 'Feb', ventas: 4200, costos: 2500, beneficio: 1700 },
    { name: 'Mar', ventas: 4800, costos: 2800, beneficio: 2000 },
    { name: 'Abr', ventas: 4600, costos: 2700, beneficio: 1900 },
    { name: 'May', ventas: 5000, costos: 2900, beneficio: 2100 },
    { name: 'Jun', ventas: 5200, costos: 3000, beneficio: 2200 },
    { name: 'Jul', ventas: 5400, costos: 3100, beneficio: 2300 },
    { name: 'Ago', ventas: 5600, costos: 3200, beneficio: 2400 },
    { name: 'Sep', ventas: 5800, costos: 3300, beneficio: 2500 },
    { name: 'Oct', ventas: 6000, costos: 3400, beneficio: 2600 },
    { name: 'Nov', ventas: 6200, costos: 3500, beneficio: 2700 },
    { name: 'Dic', ventas: 6400, costos: 3600, beneficio: 2800 }
  ];

  const dataPie = [
    { name: 'Producto A', ventas: 4500 },
    { name: 'Producto B', ventas: 3200 },
    { name: 'Producto C', ventas: 2800 }
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (session?.token) {
        try {
          const data = {
            name: session.token.name,
            email: session.token.email,
            id: parseInt(session.token.sub)
          };

          const response = await fetch("/api/mysqlConsulta", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });

          const resDB = await response.json();
          if (resDB && Array.isArray(resDB)) {
            setChartData(resDB);
          }
        } catch (error) {
          console.log("Error al obtener datos:", error);
        }
      }
    };

    fetchData();
  }, [session]); // Solo se ejecuta cuando cambia la sesión

  const { status } = useSession({
    required: true,
  });

  if (status === "loading") {
    return (
      <div className="mt-48 mb-5">
        <h1 className="dark:text-gray-300 font-bold py-2 px-4 rounded-lg text-center">
          Cargando...
        </h1>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-7xl h-[600px] p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          Dashboard de Métricas AdaptiveChart
        </h2>
        <SmartMultiModalChart data={dataMixtoComplejo} />

        <AdaptiveChart data={dataMixtoComplejo} />

        <SmartMultiModalModernChart data={dataMixto} />


      </div>

    </div>

  );
};

export default Testeo;