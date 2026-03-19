import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
  Legend
} from "recharts";

const COLORS = ["#10a37f","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16"];

function ChartRenderer({ data, chartType }) {
  if (!data || data.length === 0) return (
    <div style={{textAlign:"center",color:"#555",padding:"40px",fontSize:"13px"}}>
      No chart data available
    </div>
  );

  const keys = Object.keys(data[0]);
  const categoryKey = keys[0];
  const valueKeys = keys.slice(1);
  const valueKey = valueKeys[0];

  const commonProps = {
    data,
    margin: { top: 10, right: 20, left: 0, bottom: 60 }
  };

  const xAxis = (
    <XAxis
      dataKey={categoryKey}
      tick={{ fill: "#8e8ea0", fontSize: 11 }}
      axisLine={{ stroke: "#3f3f3f" }}
      tickLine={false}
      angle={-35}
      textAnchor="end"
      interval={0}
    />
  );

  const yAxis = (
    <YAxis
      tick={{ fill: "#8e8ea0", fontSize: 11 }}
      axisLine={false}
      tickLine={false}
      width={65}
      tickFormatter={v => {
        if (v >= 1000000) return (v/1000000).toFixed(1) + "M";
        if (v >= 1000) return (v/1000).toFixed(1) + "K";
        return v;
      }}
    />
  );

  const tooltip = (
    <Tooltip
      contentStyle={{
        background: "#1e1e1e",
        border: "1px solid #3f3f3f",
        borderRadius: "8px",
        color: "#ececec",
        fontSize: "12px"
      }}
      cursor={{ fill: "rgba(255,255,255,0.05)" }}
    />
  );

  const grid = <CartesianGrid strokeDasharray="3 3" stroke="#2f2f2f" vertical={false}/>;
  const legend = <Legend wrapperStyle={{color:"#8e8ea0", fontSize:"12px", paddingTop:"8px"}}/>;

  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <LineChart {...commonProps}>
          {grid}{xAxis}{yAxis}{tooltip}{legend}
          {valueKeys.map((key, i) => (
            <Line key={key} type="monotone" dataKey={key}
              stroke={COLORS[i % COLORS.length]} strokeWidth={2.5}
              dot={{ fill: COLORS[i % COLORS.length], r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart {...commonProps}>
          {grid}{xAxis}{yAxis}{tooltip}{legend}
          {valueKeys.map((key, i) => (
            <Area key={key} type="monotone" dataKey={key}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.15} strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "pie" || chartType === "donut") {
    const RADIAN = Math.PI / 180;
    const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
      if (percent < 0.05) return null;
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
      return (
        <text x={x} y={y} fill="#fff" textAnchor="middle"
          dominantBaseline="central" fontSize={11}>
          {(percent * 100).toFixed(0) + "%"}
        </text>
      );
    };

    return (
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          {tooltip}
          <Legend wrapperStyle={{color:"#8e8ea0", fontSize:"12px"}}/>
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={categoryKey}
            cx="50%" cy="45%"
            outerRadius={100}
            innerRadius={chartType === "donut" ? 50 : 0}
            labelLine={false}
            label={renderLabel}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]}/>
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart {...commonProps} barSize={data.length > 10 ? 12 : 32}>
        {grid}{xAxis}{yAxis}{tooltip}{legend}
        {valueKeys.map((key, i) => (
          <Bar key={key} dataKey={key}
            fill={COLORS[i % COLORS.length]}
            radius={[4, 4, 0, 0]}
          >
            {valueKeys.length === 1 && data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]}/>
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export default ChartRenderer;
