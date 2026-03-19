import { useState, useRef, useEffect } from "react";
import ChartRenderer from "../Charts/ChartRenderer";
import { exportToPDF } from "../../services/exportPDF";
import { exportToExcel } from "../../services/exportExcel";

const UI = {
  en: { table:"Table", chart:"Chart", sql:"SQL", insight:"Insight", downloadExcel:"Download Excel", downloadPDF:"Download PDF", copy:"Copy", copied:"Copied!", noSQL:"No SQL generated", noData:"No data returned", noInsight:"No insight available", bar:"Bar", line:"Line", area:"Area", pie:"Pie", donut:"Donut" },
  ta: { table:"அட்டவணை", chart:"விளக்கப்படம்", sql:"SQL", insight:"நுண்ணறிவு", downloadExcel:"Excel பதிவிறக்கம்", downloadPDF:"PDF பதிவிறக்கம்", copy:"நகலெடு", copied:"நகலெடுக்கப்பட்டது!", noSQL:"SQL உருவாக்கப்படவில்லை", noData:"தரவு இல்லை", noInsight:"நுண்ணறிவு இல்லை", bar:"பட்டை", line:"கோடு", area:"பரப்பு", pie:"வட்டம்", donut:"டோனட்" },
  hi: { table:"तालिका", chart:"चार्ट", sql:"SQL", insight:"अंतर्दृष्टि", downloadExcel:"Excel डाउनलोड", downloadPDF:"PDF डाउनलोड", copy:"कॉपी करें", copied:"कॉपी हो गया!", noSQL:"SQL नहीं बना", noData:"कोई डेटा नहीं", noInsight:"कोई अंतर्दृष्टि नहीं", bar:"बार", line:"रेखा", area:"क्षेत्र", pie:"पाई", donut:"डोनट" },
  te: { table:"పట్టిక", chart:"చార్ట్", sql:"SQL", insight:"అంతర్దృష్టి", downloadExcel:"Excel డౌన్‌లోడ్", downloadPDF:"PDF డౌన్‌లోడ్", copy:"కాపీ చేయి", copied:"కాపీ అయింది!", noSQL:"SQL రూపొందించబడలేదు", noData:"డేటా లేదు", noInsight:"అంతర్దృష్టి లేదు", bar:"బార్", line:"రేఖ", area:"విస్తీర్ణం", pie:"పై", donut:"డోనట్" },
  ml: { table:"പട്ടിക", chart:"ചാർട്ട്", sql:"SQL", insight:"ഉൾക്കാഴ്ച", downloadExcel:"Excel ഡൗൺലോഡ്", downloadPDF:"PDF ഡൗൺലോഡ്", copy:"പകർത്തുക", copied:"പകർത്തി!", noSQL:"SQL ഉണ്ടാക്കിയില്ല", noData:"ഡേറ്റ ഇല്ല", noInsight:"ഉൾക്കാഴ്ച ഇല്ല", bar:"ബാർ", line:"രേഖ", area:"ഏരിയ", pie:"പൈ", donut:"ഡോനട്ട്" },
  kn: { table:"ಕೋಷ್ಟಕ", chart:"ಚಾರ್ಟ್", sql:"SQL", insight:"ಒಳನೋಟ", downloadExcel:"Excel ಡೌನ್‌ಲೋಡ್", downloadPDF:"PDF ಡೌನ್‌ಲೋಡ್", copy:"ನಕಲು ಮಾಡಿ", copied:"ನಕಲಾಗಿದೆ!", noSQL:"SQL ರಚಿಸಲಾಗಿಲ್ಲ", noData:"ಡೇಟಾ ಇಲ್ಲ", noInsight:"ಒಳನೋಟ ಇಲ್ಲ", bar:"ಬಾರ್", line:"ರೇಖೆ", area:"ಪ್ರದೇಶ", pie:"ಪೈ", donut:"ಡೋನಟ್" },
  bn: { table:"টেবিল", chart:"চার্ট", sql:"SQL", insight:"অন্তর্দৃষ্টি", downloadExcel:"Excel ডাউনলোড", downloadPDF:"PDF ডাউনলোড", copy:"কপি করুন", copied:"কপি হয়েছে!", noSQL:"SQL তৈরি হয়নি", noData:"কোনো ডেটা নেই", noInsight:"কোনো অন্তর্দৃষ্টি নেই", bar:"বার", line:"রেখা", area:"এরিয়া", pie:"পাই", donut:"ডোনাট" },
  gu: { table:"કોષ્ટક", chart:"ચાર્ટ", sql:"SQL", insight:"આંતરદૃષ્ટિ", downloadExcel:"Excel ડાઉનલોડ", downloadPDF:"PDF ડાઉનલોડ", copy:"કૉપિ કરો", copied:"કૉપિ થઈ!", noSQL:"SQL બન્યો નથી", noData:"કોઈ ડેટા નથી", noInsight:"કોઈ આંતરદૃષ્ટિ નથી", bar:"બાર", line:"રેખા", area:"વિસ્તાર", pie:"પાઇ", donut:"ડોનટ" },
  pa: { table:"ਸਾਰਣੀ", chart:"ਚਾਰਟ", sql:"SQL", insight:"ਸੂਝ", downloadExcel:"Excel ਡਾਊਨਲੋਡ", downloadPDF:"PDF ਡਾਊਨਲੋਡ", copy:"ਕਾਪੀ ਕਰੋ", copied:"ਕਾਪੀ ਹੋ ਗਈ!", noSQL:"SQL ਨਹੀਂ ਬਣਿਆ", noData:"ਕੋਈ ਡੇਟਾ ਨਹੀਂ", noInsight:"ਕੋਈ ਸੂਝ ਨਹੀਂ", bar:"ਬਾਰ", line:"ਰੇਖਾ", area:"ਖੇਤਰ", pie:"ਪਾਈ", donut:"ਡੋਨਟ" },
  ar: { table:"جدول", chart:"مخطط", sql:"SQL", insight:"رؤية", downloadExcel:"تحميل Excel", downloadPDF:"تحميل PDF", copy:"نسخ", copied:"تم النسخ!", noSQL:"لم يتم إنشاء SQL", noData:"لا توجد بيانات", noInsight:"لا توجد رؤية", bar:"شريطي", line:"خطي", area:"مساحة", pie:"دائري", donut:"دونات" },
  fr: { table:"Tableau", chart:"Graphique", sql:"SQL", insight:"Aperçu", downloadExcel:"Télécharger Excel", downloadPDF:"Télécharger PDF", copy:"Copier", copied:"Copié!", noSQL:"Aucun SQL généré", noData:"Aucune donnée", noInsight:"Aucun aperçu", bar:"Barres", line:"Lignes", area:"Aires", pie:"Camembert", donut:"Donut" },
  de: { table:"Tabelle", chart:"Diagramm", sql:"SQL", insight:"Einblick", downloadExcel:"Excel herunterladen", downloadPDF:"PDF herunterladen", copy:"Kopieren", copied:"Kopiert!", noSQL:"Kein SQL generiert", noData:"Keine Daten", noInsight:"Kein Einblick", bar:"Balken", line:"Linie", area:"Fläche", pie:"Kreis", donut:"Donut" },
  ja: { table:"テーブル", chart:"グラフ", sql:"SQL", insight:"洞察", downloadExcel:"Excelダウンロード", downloadPDF:"PDFダウンロード", copy:"コピー", copied:"コピーしました!", noSQL:"SQLが生成されていません", noData:"データがありません", noInsight:"洞察がありません", bar:"棒", line:"折れ線", area:"面積", pie:"円", donut:"ドーナツ" },
  zh: { table:"表格", chart:"图表", sql:"SQL", insight:"洞察", downloadExcel:"下载Excel", downloadPDF:"下载PDF", copy:"复制", copied:"已复制!", noSQL:"未生成SQL", noData:"无数据", noInsight:"无洞察", bar:"柱状", line:"折线", area:"面积", pie:"饼图", donut:"环形" },
};

function getLang() {
  return UI[localStorage.getItem("language")] ? localStorage.getItem("language") : "en";
}

function Message({ message, question }) {
  const [activeTab, setActiveTab] = useState("table");
  const [copied, setCopied] = useState(false);
  const [chartType, setChartType] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {
    setChartType(message.chart?.type || "bar");
  }, [message]);

  const t = UI[getLang()];

  const copySQL = () => {
    navigator.clipboard.writeText(message.sql || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExcelExport = () => {
    exportToExcel(question || message.question || "", message.data, message.insight, getLang());
  };

  const handlePDFExport = async () => {
    const wasOnChart = activeTab === "chart";
    if (!wasOnChart) setActiveTab("chart");
    await new Promise(r => setTimeout(r, 300));
    await exportToPDF(question || message.question || "", message.sql, message.data, message.insight, getLang());
    if (!wasOnChart) setActiveTab("table");
  };

  if (message.role === "user") {
    return (
      <div className="message-row user-row">
        <div className="message-content">
          <div className="user-bubble">{message.text}</div>
        </div>
        <div className="avatar user-avatar">{message.userInitial || "H"}</div>
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
              {t[tab]}
            </button>
          ))}
          {message.data && message.data.length > 0 && (
            <>
              <button className="tab-btn export-btn" onClick={handleExcelExport}>{t.downloadExcel}</button>
              <button className="tab-btn export-btn" onClick={handlePDFExport}>{t.downloadPDF}</button>
            </>
          )}
        </div>

        {activeTab === "sql" && (
          <div className="sql-box">
            <div className="sql-header">
              <span className="sql-lang">SQL</span>
              <button className="copy-btn" onClick={copySQL}>{copied ? t.copied : t.copy}</button>
            </div>
            <pre>{message.sql || t.noSQL}</pre>
          </div>
        )}

        {activeTab === "table" && (
          message.data && message.data.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>{Object.keys(message.data[0]).map(col => <th key={col}>{col}</th>)}</tr>
                </thead>
                <tbody>
                  {message.data.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val, j) => (
                        <td key={j}>{typeof val === "number" ? val.toLocaleString() : val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: "#555", fontSize: "13px", padding: "16px 0" }}>{t.noData}</p>
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
                  {t[type]}
                </button>
              ))}
            </div>
            <ChartRenderer data={message.data} chartType={activeChartType} />
          </div>
        )}

        {activeTab === "insight" && (
          <div className="insight-box">
            <p style={{ color: "#ececec", fontSize: "13px", lineHeight: "1.7" }}>
              {message.insight || t.noInsight}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default Message;
