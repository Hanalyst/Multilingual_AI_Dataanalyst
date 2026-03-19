import { useState, useRef, useEffect } from "react";
import ChartRenderer from "../Charts/ChartRenderer";
import { exportToPDF } from "../../services/exportPDF";
import { exportToExcel } from "../../services/exportExcel";

function Message({ message, question }) {
  const [activeTab, setActiveTab] = useState("table");
  const [copied, setCopied] = useState(false);
  const [chartType, setChartType] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {
    setChartType(message.chart?.type || "bar");
  }, [message]);

  const copySQL = () => {
    navigator.clipboard.writeText(message.sql || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExcelExport = () => {
    exportToExcel(
      question || message.question || "",
      message.data,
      message.insight
    );
  };

  const handlePDFExport = async () => {
    const wasOnChart = activeTab === "chart";
    if (!wasOnChart) setActiveTab("chart");
    await new Promise(r => setTimeout(r, 300));
    await exportToPDF(
      question || message.question || "",
      message.sql,
      message.data,
      message.insight
    );
    if (!wasOnChart) setActiveTab("table");
  };

  if (message.role === "user") {
    return (
      <div className="message-row user-row">
        <div className="message-content">
          <div className="user-bubble">{message.text}</div>
        </div>
        <div className="avatar user-avatar">
          {message.userInitial || "H"}
        </div>
      </div>
    );
  }

  const activeChartType = chartType || message.chart?.type || "bar";

  return (
    <div className="message-row">
      <div className="avatar ai-avatar">AI</div>
      <div className="message-content ai-bubble">

        <div className="tabs">
          {["table", "chart", "sql", "insight"].map(tab => (
            <button
              key={tab}
              className={"tab-btn" + (activeTab === tab ? " active" : "")}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "sql" ? "SQL" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}

          {message.data && message.data.length > 0 && (
            <>
              <button className="tab-btn export-btn" onClick={handleExcelExport}>
                Download Excel
              </button>
              <button className="tab-btn export-btn" onClick={handlePDFExport}>
                Download PDF
              </button>
            </>
          )}
        </div>

        {activeTab === "sql" && (
          <div className="sql-box">
            <div className="sql-header">
              <span className="sql-lang">SQL</span>
              <button className="copy-btn" onClick={copySQL}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre>{message.sql || "No SQL generated"}</pre>
          </div>
        )}

        {activeTab === "table" && (
          message.data && message.data.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {Object.keys(message.data[0]).map(col => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {message.data.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val, j) => (
                        <td key={j}>
                          {typeof val === "number" ? val.toLocaleString() : val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: "#555", fontSize: "13px", padding: "16px 0" }}>
              No data returned
            </p>
          )
        )}

        {activeTab === "chart" && (
          <div className="chart-box" ref={chartRef}>
            <div className="chart-type-selector">
              {["bar", "line", "area", "pie", "donut"].map(type => (
                <button
                  key={type}
                  className={"chart-type-btn" + (activeChartType === type ? " chart-type-active" : "")}
                  onClick={() => setChartType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            <ChartRenderer
              data={message.data}
              chartType={activeChartType}
            />
          </div>
        )}

        {activeTab === "insight" && (
          <div className="insight-box">
            <p style={{ color: "#ececec", fontSize: "13px", lineHeight: "1.7" }}>
              {message.insight || "No insight available"}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default Message;
