import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// eslint-disable-next-line no-control-regex
function isLatin(text) {
  if (!text) return true;
  const nonLatin = (text.match(/[^\x20-\x7E]/g) || []).length;
  return nonLatin / text.length < 0.3;
}

async function captureEl(el, bgColor = "#ffffff") {
  if (!el) return null;
  try {
    const { default: html2canvas } = await import("html2canvas");
    const prevBg = el.style.backgroundColor;
    const prevColor = el.style.color;
    el.style.backgroundColor = bgColor;
    el.style.color = "#111111";
    el.querySelectorAll("*").forEach(child => {
      child._prevColor = child.style.color;
      child.style.color = "#111111";
    });
    await new Promise(r => setTimeout(r, 100));
    const canvas = await html2canvas(el, {
      backgroundColor: bgColor,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false
    });
    el.style.backgroundColor = prevBg;
    el.style.color = prevColor;
    el.querySelectorAll("*").forEach(child => {
      child.style.color = child._prevColor || "";
    });
    return canvas.toDataURL("image/png");
  } catch (e) {
    console.error("Capture error:", e);
    return null;
  }
}

async function captureCloneEl(el, bgColor = "#ffffff", hideSelector = null) {
  if (!el) return null;
  try {
    const { default: html2canvas } = await import("html2canvas");
    const clone = el.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.top = "-9999px";
    clone.style.left = "-9999px";
    clone.style.width = el.offsetWidth + "px";
    clone.style.background = bgColor;
    clone.style.border = "none";
    clone.style.borderRadius = "0";
    clone.style.padding = "16px";
    if (hideSelector) {
      const hideEl = clone.querySelector(hideSelector);
      if (hideEl) hideEl.style.display = "none";
    }
    document.body.appendChild(clone);
    await new Promise(r => setTimeout(r, 300));
    const canvas = await html2canvas(clone, {
      backgroundColor: bgColor,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false
    });
    document.body.removeChild(clone);
    return canvas.toDataURL("image/png");
  } catch (e) {
    console.error("Clone capture error:", e);
    return null;
  }
}

export async function exportToPDF(question, sql, data, insight, activeTab, setActiveTab, msgId) {
  const doc = new jsPDF();
  const questionText = (question && question.trim()) ? question.trim() : "No question recorded";
  const questionIsLatin = isLatin(questionText);
  const insightIsLatin = isLatin(insight || "");

  // Scope selector to specific message
  const scope = msgId ? document.querySelector(`[data-msg-id="${msgId}"]`) : document;
  const scopedQuery = (sel) => scope ? scope.querySelector(sel) : document.querySelector(sel);

  // Also find the user bubble - it's in previous sibling message row
  const allMsgRows = document.querySelectorAll(".message-row");
  let userBubbleEl = null;
  allMsgRows.forEach((row, i) => {
    if (scope && row.contains(scope) && i > 0) {
      userBubbleEl = allMsgRows[i - 1].querySelector(".user-bubble");
    }
  });

  // Header
  doc.setFillColor(16, 163, 127);
  doc.rect(0, 0, 210, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("Hanalyst Report", 14, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString(), 160, 14);

  let y = 32;

  // Question
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Question", 14, y);
  y += 6;

  if (questionIsLatin) {
    const qLines = doc.splitTextToSize(questionText, 175);
    doc.setFillColor(240, 253, 248);
    doc.rect(12, y - 3, 185, qLines.length * 5.5 + 6, "F");
    doc.setDrawColor(16, 163, 127);
    doc.setLineWidth(2);
    doc.line(12, y - 3, 12, y + qLines.length * 5.5 + 3);
    doc.setLineWidth(0.3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(15, 110, 86);
    doc.text(qLines, 16, y + 2);
    y += qLines.length * 5.5 + 12;
  } else {
    const imgData = await captureEl(userBubbleEl, "#e8fdf5");
    if (imgData) {
      const tmpImg = new Image();
      await new Promise(r => { tmpImg.onload = r; tmpImg.src = imgData; });
      const imgH = Math.round((tmpImg.height / tmpImg.width) * 182 / 2);
      doc.setFillColor(240, 253, 248);
      doc.rect(12, y - 3, 185, imgH + 10, "F");
      doc.addImage(imgData, "PNG", 14, y, 182, imgH);
      y += imgH + 14;
    }
  }

  // SQL
  if (sql) {
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Generated SQL", 14, y);
    y += 6;
    const sqlLines = doc.splitTextToSize(sql, 173);
    const sqlBoxH = sqlLines.length * 4.5 + 10;
    doc.setFillColor(245, 245, 245);
    doc.rect(12, y - 3, 185, sqlBoxH, "F");
    doc.setDrawColor(16, 163, 127);
    doc.setLineWidth(2);
    doc.line(12, y - 3, 12, y - 3 + sqlBoxH);
    doc.setLineWidth(0.3);
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(20, 100, 60);
    doc.text(sqlLines, 16, y + 2);
    y += sqlBoxH + 12;
  }

  // Chart
  if (y > 180) { doc.addPage(); y = 20; }
  const chartEl = scopedQuery(".chart-box");
  const chartImg = await captureCloneEl(chartEl, "#ffffff", ".chart-type-selector");
  if (chartImg) {
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Chart", 14, y);
    y += 6;
    doc.addImage(chartImg, "PNG", 14, y, 182, 90);
    y += 102;
  }

  // Switch to table tab
  if (setActiveTab) setActiveTab("table");
  await new Promise(r => setTimeout(r, 400));

  // Results table
  if (data && data.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Results", 14, y);
    y += 4;

    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      Object.values(row).map(v =>
        typeof v === "number" ? v.toLocaleString() : String(v ?? "")
      )
    );

    if (headers.every(h => isLatin(h))) {
      autoTable(doc, {
        startY: y,
        head: [headers],
        body: rows,
        theme: "grid",
        headStyles: { fillColor: [16, 163, 127], textColor: 255, fontSize: 9, fontStyle: "bold" },
        bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
      });
      y = doc.lastAutoTable.finalY + 12;
    } else {
      const tableEl = scopedQuery(".table-wrapper");
      if (tableEl) {
        const headers = tableEl.querySelectorAll("thead th");
        headers.forEach(th => { th._prevBg = th.style.backgroundColor; th._prevColor = th.style.color; th.style.backgroundColor = "#10a37f"; th.style.color = "#ffffff"; });
        await new Promise(r => setTimeout(r, 50));
      }
      const tableImg = await captureEl(tableEl, "#ffffff");
      if (tableEl) {
        const headers = tableEl.querySelectorAll("thead th");
        headers.forEach(th => { th.style.backgroundColor = th._prevBg || ""; th.style.color = th._prevColor || ""; });
      }
      if (tableImg) {
        const tmpImg = new Image();
        await new Promise(r => { tmpImg.onload = r; tmpImg.src = tableImg; });
        const imgH = Math.min(Math.round((tmpImg.height / tmpImg.width) * 182 / 2), 150);
        doc.addImage(tableImg, "PNG", 14, y, 182, imgH);
        y += imgH + 12;
      }
    }
  }

  // Switch to insight tab
  if (setActiveTab) setActiveTab("insight");
  await new Promise(r => setTimeout(r, 400));

  // Insight
  if (insight) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Insight", 14, y);
    y += 6;

    if (insightIsLatin) {
      const insightLines = doc.splitTextToSize(insight, 173);
      const insightBoxH = insightLines.length * 5 + 10;
      doc.setFillColor(240, 253, 248);
      doc.rect(12, y - 3, 185, insightBoxH, "F");
      doc.setDrawColor(16, 163, 127);
      doc.setLineWidth(2);
      doc.line(12, y - 3, 12, y - 3 + insightBoxH);
      doc.setLineWidth(0.3);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(15, 110, 86);
      doc.text(insightLines, 16, y + 2);
    } else {
      const insightEl = scopedQuery(".insight-box");
      const insightImg = await captureEl(insightEl, "#ffffff");
      if (insightImg) {
        const tmpImg = new Image();
        await new Promise(r => { tmpImg.onload = r; tmpImg.src = insightImg; });
        const imgH = Math.round((tmpImg.height / tmpImg.width) * 182 / 2);
        doc.setFillColor(240, 253, 248);
        doc.rect(12, y - 3, 185, imgH + 10, "F");
        doc.setDrawColor(16, 163, 127);
        doc.setLineWidth(2);
        doc.line(12, y - 3, 12, y - 3 + imgH + 10);
        doc.setLineWidth(0.3);
        doc.addImage(insightImg, "PNG", 14, y, 182, imgH);
      }
    }
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 285, 210, 12, "F");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text("Generated by Hanalyst - AI Data Analyst", 14, 292);
    doc.text("Page " + i + " of " + pageCount, 185, 292, { align: "right" });
  }

  doc.save("hanalyst_report.pdf");
}

