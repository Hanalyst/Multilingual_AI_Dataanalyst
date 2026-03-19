import html2canvas from "html2canvas";

export async function exportToExcel(question, data, insight) {
  if (!data || data.length === 0) return;

  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Hanalyst";
  workbook.created = new Date();

  const headers = Object.keys(data[0]);
  const questionText = (question && question.trim()) ? question.trim() : "No question recorded";

  // ── Sheet 1: Data ──────────────────────────────────────────────────────────
  const dataSheet = workbook.addWorksheet("Data");

  // Row 1: Question
  dataSheet.mergeCells(1, 1, 1, headers.length);
  const qCell = dataSheet.getCell("A1");
  qCell.value = questionText;
  qCell.font = { bold: true, size: 11, color: { argb: "10A37F" } };
  qCell.alignment = { horizontal: "left", vertical: "middle" };
  dataSheet.getRow(1).height = 22;

  // Row 2: thin green underline separator
  dataSheet.mergeCells(2, 1, 2, headers.length);
  const sepCell = dataSheet.getCell("A2");
  sepCell.border = { bottom: { style: "thin", color: { argb: "10A37F" } } };
  dataSheet.getRow(2).height = 4;

  // Row 3: empty
  dataSheet.addRow([]);
  dataSheet.getRow(3).height = 6;

  // Row 4: column headers
  const headerRow = dataSheet.addRow(headers);
  headerRow.eachCell(cell => {
    cell.font = { bold: true, size: 10, color: { argb: "10A37F" } };
    cell.border = { bottom: { style: "thin", color: { argb: "10A37F" } } };
    cell.alignment = { horizontal: "left", vertical: "middle" };
  });
  dataSheet.getRow(4).height = 20;

  // Data rows — plain, no fill, just clean text
  data.forEach(row => {
    const dataRow = dataSheet.addRow(Object.values(row));
    dataRow.eachCell((cell, colNum) => {
      const val = Object.values(row)[colNum - 1];
      cell.font = { size: 10 };
      cell.alignment = {
        horizontal: typeof val === "number" ? "right" : "left",
        vertical: "middle"
      };
      cell.border = {
        bottom: { style: "hair", color: { argb: "E2E8F0" } }
      };
    });
    dataRow.height = 18;
  });

  // Auto column width
  headers.forEach((h, i) => {
    const col = dataSheet.getColumn(i + 1);
    let maxLen = h.length;
    data.forEach(row => {
      const val = String(Object.values(row)[i] ?? "");
      if (val.length > maxLen) maxLen = val.length;
    });
    col.width = Math.min(maxLen + 4, 40);
  });

  // Insight — plain text at bottom
  if (insight) {
    dataSheet.addRow([]);
    dataSheet.addRow([]);

    const insightLabelRow = dataSheet.addRow(["Insight"]);
    insightLabelRow.getCell(1).font = { bold: true, size: 10, color: { argb: "10A37F" } };
    insightLabelRow.getCell(1).border = {
      bottom: { style: "hair", color: { argb: "10A37F" } }
    };
    dataSheet.getRow(dataSheet.rowCount).height = 18;

    const insightRow = dataSheet.addRow([insight]);
    insightRow.getCell(1).font = { size: 10, color: { argb: "444444" } };
    insightRow.getCell(1).alignment = { wrapText: true, vertical: "top" };
    if (headers.length > 1)
      dataSheet.mergeCells(dataSheet.rowCount, 1, dataSheet.rowCount, headers.length);
    dataSheet.getRow(dataSheet.rowCount).height = 70;
  }

  // ── Sheet 2: Chart ─────────────────────────────────────────────────────────
  const chartSheet = workbook.addWorksheet("Chart");

  // Row 1: Question
  chartSheet.mergeCells("A1:L1");
  const chartQCell = chartSheet.getCell("A1");
  chartQCell.value = questionText;
  chartQCell.font = { bold: true, size: 11, color: { argb: "10A37F" } };
  chartQCell.alignment = { horizontal: "left", vertical: "middle" };
  chartSheet.getRow(1).height = 22;

  // Row 2: separator
  chartSheet.mergeCells("A2:L2");
  chartSheet.getCell("A2").border = {
    bottom: { style: "thin", color: { argb: "10A37F" } }
  };
  chartSheet.getRow(2).height = 4;

  // Row 3: empty
  chartSheet.getRow(3).height = 8;

  // Capture chart from DOM and embed
  const chartEl = document.querySelector(".chart-box");
  if (chartEl) {
    try {
      const canvas = await html2canvas(chartEl, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL("image/png");
      const base64 = imgData.replace("data:image/png;base64,", "");

      const imageId = workbook.addImage({ base64, extension: "png" });
      chartSheet.addImage(imageId, {
        tl: { col: 0, row: 3 },
        ext: { width: 680, height: 360 }
      });

      for (let r = 4; r <= 25; r++) {
        chartSheet.getRow(r).height = 20;
      }

    } catch (e) {
      console.error("Chart capture failed:", e);

      // Fallback: plain data table
      chartSheet.getRow(4).height = 8;
      const fbHeader = chartSheet.addRow(headers);
      fbHeader.eachCell(cell => {
        cell.font = { bold: true, size: 10, color: { argb: "10A37F" } };
        cell.border = { bottom: { style: "thin", color: { argb: "10A37F" } } };
      });
      data.forEach(row => {
        const r = chartSheet.addRow(Object.values(row));
        r.eachCell(cell => { cell.font = { size: 10 }; });
      });
    }
  }

  chartSheet.getColumn(1).width = 24;
  chartSheet.getColumn(2).width = 18;

  // ── Download ───────────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hanalyst_report.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}