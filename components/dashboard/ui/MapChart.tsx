// // ui/chartComponents.tsx
// import React from 'react';
// import DataTable from './DataTable';
// import CustomLineChart from './line-chart';
// import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
// import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip, Legend as BarLegend } from 'recharts';
// import { ChartType } from '../types';

// // helper para aplanar estructuras GA4
// function flattenGA4Rows(rows: any, dims: any[], mets: any[]) {
//   return rows.map((r: any) => {
//     const obj: Record<string, any> = {};
//     r.dimensionValues.forEach((d: any, i: number) => (obj[dims[i].name] = d.value));
//     r.metricValues.forEach((m: any, i: number) => (obj[mets[i].name] = m.value));
//     return obj;
//   });
// }

// export function renderDataTable(dataset: { dimensionHeaders: any[]; metricHeaders: any[]; rows: any[] }) {
//   const { dimensionHeaders, metricHeaders, rows } = dataset;
//   const flat = flattenGA4Rows(rows, dimensionHeaders, metricHeaders);
//   return <DataTable data={flat} />;
// }

// export function renderChart(
//   key: string,
//   chartType: ChartType,
//   data: any[]
// ) {
//   switch (chartType) {
//     case 'line':
//       return <CustomLineChart data={data} />;

//     case 'bar':
//       return (
//         <ResponsiveContainer width="100%" height={300}>
//           <ReBarChart data={data}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="label" />
//             <YAxis />
//             <BarTooltip />
//             <BarLegend />
//             <Bar dataKey="value" />
//           </ReBarChart>
//         </ResponsiveContainer>
//       );

//     case 'pie':
//       const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1'];
//       return (
//         <ResponsiveContainer width="100%" height={300}>
//           <RePieChart>
//             <Pie
//               data={data}
//               dataKey="value"
//               nameKey="label"
//               cx="50%"
//               cy="50%"
//               outerRadius={100}
//               fill="#8884d8"
//               label
//             >
//               {data.map((entry, index) => (
//                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//               ))}
//             </Pie>
//             <Tooltip />
//           </RePieChart>
//         </ResponsiveContainer>
//       );

//     default:
//       return null;
//   }
// }


// components/dashboard/ui/MapChart.tsx

// components/dashboard/ui/MapChart.tsx
import React from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { colors } from "../constants/colors";

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/world/50m.json"; // coloca world-50m.json en /public

// Centroides aproximados de cada país (lon, lat)
const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  Chile: [-71.542969, -33.44889],
  Germany: [10.451526, 51.165691],
  Argentina: [-63.616671, -38.416097],
  Venezuela: [-66.58973, 6.42375],
  "United States": [-95.712891, 37.09024],
  Brazil: [-51.92528, -14.235004],
  Bolivia: [-63.588653, -16.290154],
  Spain: [-3.74922, 40.463667],
  Colombia: [-74.297333, 4.570868],
  Peru: [-75.015152, -9.189967],
  Algeria: [1.659626, 28.033886],
  Australia: [134.491, -25.734968],
  China: [104.195397, 35.86166],
  Ecuador: [-78.183406, -1.831239],
  France: [2.213749, 46.227638],
  Italy: [12.56738, 41.87194],
  Japan: [138.252924, 36.204824],
  Mexico: [-102.552784, 23.634501],
  Sweden: [18.643501, 60.128161],
  Uruguay: [-55.765835, -32.522779],
  Indonesia: [113.921327, -0.789275],
  Hungary: [19.503304, 47.162494],
  "United Kingdom": [-3.435973, 55.378051],
  // añade los que necesites...
};

export interface PaisData {
  pais: string;
  total: number;
  regiones: { region: string; sesiones: number }[];
}

interface MapChartProps {
  paises: PaisData[];
}

const MapChart: React.FC<MapChartProps> = ({ paises = [] }) => {
  if (!paises.length) return null;

  // Escala de color de 0 a máximo
  const max = Math.max(...paises.map((p) => p.total));
  const colorScale = scaleLinear<string>()
    .domain([0, max])
    .range([colors.glass, colors.accent]);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: colors.background, padding: "1rem" }}
    >
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 160 }}
        width={800}
        height={400}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const name = geo.properties.NAME as string;
              const data = paises.find((p) => p.pais === name);
              const fill = data ? colorScale(data.total) : colors.secondary;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke={colors.grid}
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: {
                      fill: colors.accent,
                      transition: "all 200ms",
                      outline: "none",
                    },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>

        {paises.map(({ pais, total }) => {
          const coords = COUNTRY_COORDINATES[pais];
          if (!coords) return null;
          // radio proporcional √total
          const radius = Math.sqrt(total) / Math.sqrt(max) * 20 + 2;
          return (
            <Marker key={pais} coordinates={coords}>
              <circle
                r={radius}
                fill={colors.warning}
                stroke={colors.text}
                strokeWidth={0.5}
              />
              <text
                textAnchor="middle"
                y={-radius - 4}
                style={{ fill: colors.text, fontSize: "10px" }}
              >
                {total}
              </text>
            </Marker>
          );
        })}
      </ComposableMap>
    </div>
  );
};

export default MapChart;

