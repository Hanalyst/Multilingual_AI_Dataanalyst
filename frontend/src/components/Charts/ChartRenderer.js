import React from "react";
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  AreaChart, Area,
  ScatterChart, Scatter,
  XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = [
  "#10a37f", "#3b82f6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
];

const CHART_HEIGHT = 300;

// Compact number formatter for axes
function fmtAxis(v) {
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (Math.abs(v) >= 1_000)     return (v / 1_000).toFixed(1) + "K";
  return v;
}

// Shared axis / grid components
function makeXAxis(categoryKey, dataLength) {
  return (
    <XAxis
      dataKey={categoryKey}
      tick={{ fill: "#8e8ea0", fontSize: 11 }}
      axisLine={{ stroke: "#3f3f3f" }}
      tickLine={false}
      angle={dataLength > 6 ? -35 : 0}
      textAnchor={dataLength > 6 ? "end" : "middle"}
      interval={0}
      height={dataLength > 6 ? 64 : 40}
    />
  );
}

function makeYAxis() {
  return (
    <YAxis
      tick={{ fill: "#8e8ea0", fontSize: 11 }}
      axisLine={false}
      tickLine={false}
      width={64}
      tickFormatter={fmtAxis}
    />
  );
}

function makeTooltip() {
  return (
    <Tooltip
      contentStyle={{
        background: "#1e1e1e",
        border: "1px solid #3f3f3f",
        borderRadius: "8px",
        color: "#ececec",
        fontSize: "12px",
      }}
      cursor={{ fill: "rgba(255,255,255,0.05)" }}
      formatter={(value) => [typeof value === "number" ? value.toLocaleString() : value]}
    />
  );
}

function makeGrid() {
  return <CartesianGrid strokeDasharray="3 3" stroke="#2f2f2f" vertical={false} />;
}

function makeLegend() {
  return <Legend wrapperStyle={{ color: "#8e8ea0", fontSize: "12px" }} />;
}

// ─── Main component ──────────────────────────────────────────────────────────

function ChartRenderer({ data, chartType }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#555", padding: "40px", fontSize: "13px" }}>
        No chart data available
      </div>
    );
  }

  const keys         = Object.keys(data[0]);
  const categoryKey  = keys[0];
  const valueKeys    = keys.slice(1);
  const valueKey     = valueKeys[0];
  const dataLength   = data.length;

  const commonProps = {
    data,
    margin: { top: 10, right: 20, left: 0, bottom: dataLength > 6 ? 70 : 40 },
  };

  // ── Bar (default for categorical) ────────────────────────────────────────
  if (!chartType || chartType === "bar") {
    return (
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <BarChart {...commonProps} barSize={dataLength > 10 ? 12 : 32}>
          {makeGrid()}
          {makeXAxis(categoryKey, dataLength)}
          {makeYAxis()}
          {makeTooltip()}
          {makeLegend()}
          {valueKeys.map((key, i) => (
            <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]}>
              {/* Multi-color bars only for single-series */}
              {valueKeys.length === 1 &&
                data.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // ── Line ─────────────────────────────────────────────────────────────────
  if (chartType === "line" || chartType === "trend") {
    return (
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <LineChart {...commonProps}>
          {makeGrid()}
          {makeXAxis(categoryKey, dataLength)}
          {makeYAxis()}
          {makeTooltip()}
          {makeLegend()}
          {valueKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2.5}
              dot={{ fill: COLORS[i % COLORS.length], r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // ── Area ─────────────────────────────────────────────────────────────────
  if (chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <AreaChart {...commonProps}>
          {makeGrid()}
          {makeXAxis(categoryKey, dataLength)}
          {makeYAxis()}
          {makeTooltip()}
          {makeLegend()}
          {valueKeys.map((key, i) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // ── Pie / Donut ──────────────────────────────────────────────────────────
  if (chartType === "pie" || chartType === "donut") {
    const RADIAN = Math.PI / 180;

    const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
      if (percent < 0.04) return null;
      const r = innerRadius + (outerRadius - innerRadius) * 0.55;
      const x = cx + r * Math.cos(-midAngle * RADIAN);
      const y = cy + r * Math.sin(-midAngle * RADIAN);
      return (
        <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11}>
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      );
    };

    return (
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <PieChart>
          {makeTooltip()}
          {makeLegend()}
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={categoryKey}
            cx="50%"
            cy="45%"
            outerRadius={110}
            innerRadius={chartType === "donut" ? 55 : 0}
            labelLine={false}
            label={renderLabel}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // ── Scatter ──────────────────────────────────────────────────────────────
  if (chartType === "scatter") {
    return (
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          {makeGrid()}
          {makeTooltip()}
          <XAxis
            dataKey={categoryKey}
            tick={{ fill: "#8e8ea0", fontSize: 11 }}
            axisLine={{ stroke: "#3f3f3f" }}
            tickLine={false}
            name={categoryKey}
          />
          <YAxis
            dataKey={valueKey}
            tick={{ fill: "#8e8ea0", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            name={valueKey}
            tickFormatter={fmtAxis}
            width={64}
          />
          <Scatter data={data} fill={COLORS[0]} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  // ── Fallback: render as bar ───────────────────────────────────────────────
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart {...commonProps} barSize={dataLength > 10 ? 12 : 32}>
        {makeGrid()}
        {makeXAxis(categoryKey, dataLength)}
        {makeYAxis()}
        {makeTooltip()}
        {makeLegend()}
        {valueKeys.map((key, i) => (
          <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export default ChartRenderer;