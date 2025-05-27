// components/Dashboard/constants/colors.ts

export const colors = {
  primary: "#0a5f70", // Teal blue
  secondary: "#1a2b32", // Dark navy
  accent: "#4ae3b5", // Neon cyan
  warning: "#ff7b00", // Orange
  danger: "#d62839", // Red
  success: "#00b894", // Green
  background: "rgba(16, 24, 32, 0.85)", // Dark translucent
  glass: "rgba(10, 25, 47, 0.65)", // Glassmorphic dark blue
  text: "#e0e7ff", // Light blue-white
  grid: "rgba(74, 227, 181, 0.15)", // Faint grid lines
  chartColors: [
    "#4ae3b5",
    "#0a5f70",
    "#ff7b00",
    "#d62839",
    "#7a04eb",
    "#3a86ff",
    "#8ac926",
    "#ffbe0b",
    "#fb5607",
    "#ff006e",
  ],
  tooltipBackground: "#1a2b32", // Dark background for tooltips
  tooltipBorder: "#4ae3b5", // Accent color for tooltip borders
  hoverHighlight: "rgba(74, 227, 181, 0.2)", // Subtle highlight for hover states
};

export const tooltipStyle = {
  contentStyle: {
    backgroundColor: colors.tooltipBackground,
    borderColor: colors.tooltipBorder,
    color: colors.text,
    borderRadius: "4px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
  },
  labelStyle: { color: colors.text },
  itemStyle: { color: colors.text },
  cursor: { fill: colors.accent, opacity: 0.3 },
};