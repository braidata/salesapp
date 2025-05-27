import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import MapChart, { PaisData } from "./ui/MapChart";
import { colors } from "./constants/colors";
import { Clock, BarChart2, Globe2, DeviceSmartphone, Calendar as CalIcon } from "lucide-react";

// Tipos
interface ApiData {
  googleAdsKPIs: { calculo: { resumen: Resumen; campañas: Campaña[] } };
  googleAdsComparativo: { calculo: ComparativoCalculo };
  googleAdsDispositivos: { calculo: { dispositivos: Dispositivo[] } };
  googleAdsGeo: { calculo: { paises: PaisData[] } };
  googleAdsHorario: { calculo: HorarioRow[] };
}

type Resumen = {
  impresiones: number;
  clics: number;
  costo: number;
  conversiones: number;
  ingresos: number;
  ctr: number;
  cpc: number;
  tasaConversion: number;
  roas: number;
};

type Campaña = {
  nombre: string;
  impresiones: number;
  clics: number;
  costo: number;
  conversiones: number;
  ingresos: number;
};

type ComparativoCalculo = {
  impresiones: { actual: number; anterior: number; variacion: number };
  clics: { actual: number; anterior: number; variacion: number };
  costo: { actual: number; anterior: number; variacion: number };
  conversiones: { actual: number; anterior: number; variacion: number };
  ingresos: { actual: number; anterior: number; variacion: number };
  tendenciasDiarias: {
    actual: { fecha: string; valor: number }[];
    anterior: { fecha: string; valor: number }[];
  };
};

type Dispositivo = { dispositivo: string; sesiones: number; porcentaje: number };
type HorarioRow = { dia: string; horas: Record<string, number> };

export default function AdsAnalyticsDashboard() {
  // Estados de fechas
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/analitica/ga4-data-ads?startDate=${startDate}&endDate=${endDate}`
      );
      const json = await res.json();
      setData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading || !data)
    return (
      <div
        style={{ backgroundColor: colors.secondary, color: colors.text }}
        className="flex items-center justify-center min-h-screen"
      >
        Cargando…
      </div>
    );

  // Destructurar cálculos
  const {
    googleAdsKPIs: { calculo: kpiCalc },
    googleAdsComparativo: { calculo: compCalc },
    googleAdsDispositivos: { calculo: dispCalc },
    googleAdsGeo: { calculo: geoCalc },
    googleAdsHorario: { calculo: horCalc },
  } = data;

  const kpiLabels: Record<keyof Resumen, string> = {
    impresiones: "Impresiones",
    clics: "Clics",
    costo: "Costo",
    conversiones: "Conversiones",
    ingresos: "Ingresos",
    ctr: "CTR (%)",
    cpc: "CPC",
    tasaConversion: "Tasa conv. (%)",
    roas: "ROAS",
  };

  return (
    <div
      style={{ backgroundColor: colors.secondary, color: colors.text }}
      className="p-6 min-h-screen space-y-8"
    >
      {/* Selector de Fechas */}
      <div className="flex items-center space-x-2">
        <CalIcon size={20} />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="p-2 rounded"          
          style={{ backgroundColor: colors.background, color: colors.text }}
        />
        <span>–</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="p-2 rounded"
          style={{ backgroundColor: colors.background, color: colors.text }}
        />
        <button
          onClick={fetchData}
          className="px-4 py-2 rounded font-semibold"
          style={{ backgroundColor: colors.accent, color: colors.secondary }}
        >
          Actualizar
        </button>
      </div>

      {/* 1. KPIs Resumen */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Resumen por campaña</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(kpiCalc.resumen).map(([key, val]) => (
            <div
              key={key}
              className="flex items-center p-4 rounded-xl"
              style={{ backgroundColor: colors.glass }}
            >
              <Clock size={24} className="mr-3" color={colors.accent} />
              <div>
                <div className="text-sm">{kpiLabels[key as keyof Resumen]}</div>
                <div className="text-xl font-bold">
                  {typeof val === "number"
                    ? ["ctr", "tasaConversion"].includes(key)
                      ? `${val.toFixed(2)}%`
                      : key === "roas"
                      ? `${val.toFixed(2)}x`
                      : val.toLocaleString()
                    : val}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Tabla de campañas */}
      <section>
        <h2 className="text-2xl font-bold mb-2">Detalle de campañas</h2>
        <div
          className="overflow-x-auto rounded-xl p-4"
          style={{ backgroundColor: colors.glass }}
        >
          <table className="w-full table-auto">
            <thead>
              <tr>
                <th className="p-2 text-left">Campaña</th>
                <th className="p-2">Imp.</th>
                <th className="p-2">Clics</th>
                <th className="p-2">Costo</th>
                <th className="p-2">Conv.</th>
                <th className="p-2">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {kpiCalc.campañas.map((c) => (
                <tr key={c.nombre} className="odd:bg-background">
                  <td className="p-2">{c.nombre}</td>
                  <td className="p-2">{c.impresiones.toLocaleString()}</td>
                  <td className="p-2">{c.clics.toLocaleString()}</td>
                  <td className="p-2">{c.costo.toLocaleString()}</td>
                  <td className="p-2">{c.conversiones}</td>
                  <td className="p-2">{c.ingresos.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Comparativo + Línea */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: colors.glass }}
        >
          <h2 className="text-2xl font-bold mb-4">Comparativo vs período anterior</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(compCalc).map(([k, v]) => (
              <div
                key={k}
                className="p-3 rounded"
                style={{ backgroundColor: colors.background }}
              >
                <div className="capitalize text-sm">{k}</div>
                <div className="text-lg font-bold">
                  {v.actual.toLocaleString()} →{' '}
                  <span style={{ color: v.variacion >= 0 ? colors.success : colors.danger }}>
                    {v.variacion.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: colors.glass }}
        >
          <h2 className="text-2xl font-bold mb-2">Tendencia diaria</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={compCalc?.tendenciasDiarias?.actual.map((d, i) => ({
                fecha: d.fecha,
                actual: d.valor,
                anterior: compCalc.tendenciasDiarias.anterior[i]?.valor || 0,
              }))}
            >
              <CartesianGrid stroke={colors.grid} />
              <XAxis dataKey="fecha" stroke={colors.text} />
              <YAxis stroke={colors.text} />
              <ReTooltip
                contentStyle={{
                  backgroundColor: colors.background,
                  borderColor: colors.accent,
                  color: colors.text,
                }}
                labelStyle={{ color: colors.text }}
              />
              <Legend wrapperStyle={{ color: colors.text }} />
              <Line
                type="monotone"
                dataKey="actual"
                stroke={colors.accent}
                dot={false}
                name="Actual"
              />
              <Line
                type="monotone"
                dataKey="anterior"
                stroke={colors.warning}
                dot={false}
                name="Anterior"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 4 & 5. Dispositivos y Mapa */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: colors.glass }}
        >
          <h2 className="text-2xl font-bold mb-4">Dispositivos</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={dispCalc.dispositivos}
                dataKey="sesiones"
                nameKey="dispositivo"
                innerRadius={40}
                outerRadius={80}
                label
              >
                {dispCalc.dispositivos.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={colors.chartColors[idx % colors.chartColors.length]}
                  />
                ))}
              </Pie>
              <ReTooltip
                contentStyle={{ backgroundColor: colors.background, borderColor: colors.accent }}
                labelStyle={{ color: colors.text }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: colors.glass }}
        >
          <h2 className="text-2xl font-bold flex items-center mb-4">
            <Globe2 size={24} className="mr-2" color={colors.accent} /> Geografía
          </h2>
          <MapChart paises={geoCalc.paises} />
        </div>
      </section>

      {/* 6. Horario */}
      <section>
        <h2 className="text-2xl font-bold flex items-center mb-2">
          <CalIcon size={24} className="mr-2" color={colors.accent} /> Horario
        </h2>
        <div
          className="overflow-x-auto rounded-xl p-4"
          style={{ backgroundColor: colors.glass }}
        >
          <table className="w-full table-auto text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left">Día</th>
                {Array.from({ length: 24 }).map((_, h) => (
                  <th key={h} className="p-1 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {horCalc.map((row) => (
                <tr key={row.dia} className="odd:bg-background">
                  <td className="p-2">
                    {["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"][+row.dia]}
                  </td>
                  {Object.values(row.horas).map((v, i) => (
                    <td key={i} className="p-1 text-xs">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}