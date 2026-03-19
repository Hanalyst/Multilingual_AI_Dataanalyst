import { useState, useEffect } from "react";
import ChartRenderer from "../Charts/ChartRenderer";

// Chart types the user can manually switch between
const CHART_TABS = [
  { key: "bar",   label: "Bar" },
  { key: "line",  label: "Line" },
  { key: "area",  label: "Area" },
  { key: "pie",   label: "Pie" },
  { key: "donut", label: "Donut" },
];

/**
 * Props:
 *  - data          : array of row objects  (required)
 *  - recommendedType : chart type string from backend  (e.g. "bar", "pie")
 */
function ChartView({ data, recommendedType }) {
  // Reset the active chart type whenever the backend sends a new recommendation
  const [activeType, setActiveType] = useState(recommendedType || "bar");

  useEffect(() => {
    if (recommendedType) {
      setActiveType(recommendedType);
    }
  }, [recommendedType, data]);

  return (
    <div className="chart-view">
      {/* Chart type switcher */}
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

      {/* Chart */}
      <div className="chart-body">
        <ChartRenderer data={data} chartType={activeType} />
      </div>
    </div>
  );
}

export default ChartView;