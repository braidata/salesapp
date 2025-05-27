// components/Dashboard/types/index.ts

// Importaciones externas
import { ReactNode } from "react";
import {
  BarProps,
  LineProps,
  PieProps,
  AreaProps,
  RadarProps,
  FunnelProps,
  ComposedChartProps,
  TreemapProps
} from "recharts";

// Types based on the API response
export interface KPIResponse {
  success: boolean;
  message: string;
  metadata: {
    periodo: { startDate: string; endDate: string };
    kpisHabilitados: number;
    kpisExitosos: number;
  };
  data: Record<string, any>;
}

// Chart type options
export type ChartType = "bar" | "line" | "pie" | "area" | "radar" | "funnel" | "composed" | "treemap";

// Sort options
export type SortOption = "date" | "value" | "name" | "none";

// View mode options
export type ViewMode = "chart" | "table";

// Custom date range
export interface CustomDateRange {
  startDate: string;
  endDate: string;
}

// VTEX Cache structure
export interface VtexCache {
  products: any;
  orders: any;
  lastFetch: number | null;
  expiresAt: number | null;
}

// VTEX Pagination structure
export interface VtexPagination {
  products: { current: number; total: number; perPage: number };
  orders: { current: number; total: number; perPage: number };
}

// Type for Summary data
export interface KpiSummary {
  title: string;
  value: string;
  subValue: string;
  status: "success" | "warning" | "error" | "normal";
}