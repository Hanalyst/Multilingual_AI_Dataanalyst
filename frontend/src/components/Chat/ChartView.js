import { useState, useEffect } from "react";
import ChartRenderer from "../Charts/ChartRenderer";

const CHART_TABS = [
  { key: "bar",   label: "Bar" },
  { key: "line",  label: "Line" },
  { key: "area",  label: "Area" },
  { key: "pie",   label: "Pie" },
  { key: "donut", label: "Donut" },
];

function ChartView({ data, recommendedType }) {
  const [activeType, setActiveType] = useState(recommendedType || "bar");

  useEffect(() => {
    if (recommendedType) setActiveType(recommendedType);
  }, [recommendedType, data]);

  return (
    <div className="chart-view">
      <div className="chart-tabs">
        {CHART_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`chart-tab-btn ${activeType === tab.key ? "active" : ""}`}
            onClick={() => setActiveType(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="chart-body">
        <ChartRenderer data={data} chartType={activeType} />
      </div>
    </div>
  );
}

export default ChartView;
