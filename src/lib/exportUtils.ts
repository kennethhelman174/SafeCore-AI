import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import Papa from "papaparse";
// xlsx import removed due to security vulnerability.
// Excel export is a future enhancement. We fall back to CSV export for now.

/**
 * Captures an HTML element and converts it to a PDF
 * @param elementId The ID of the HTML element to export
 * @param fileName The name of the file to save
 */
export async function exportToPDF(elementId: string, fileName: string) {
  const input = document.getElementById(elementId);
  if (!input) {
    throw new Error(`Export container element with ID "${elementId}" not found.`);
  }

  // Backup styles
  const originalStyle = input.style.cssText;
  
  // Temporarily make it measurable and renderable for html-to-image
  input.style.position = "absolute";
  input.style.left = "0px";
  input.style.top = "0px";
  input.style.width = "794px";
  input.style.opacity = "1";
  input.style.zIndex = "-1";
  input.style.backgroundColor = "white";

  // Allow layout to settle before capturing
  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    const dataUrl = await toPng(input, {
      pixelRatio: 2,
      backgroundColor: 'white'
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(dataUrl);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    let pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // Handle multipage if content is longer than one page
    const pageHeight = pdf.internal.pageSize.getHeight();
    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(dataUrl, "PNG", 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(dataUrl, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${fileName}.pdf`);
  } catch (error: any) {
    console.error("PDF generation failed:", error);
    throw new Error(error.message || "Failed to generate PDF");
  } finally {
    // Restore styling
    input.style.cssText = originalStyle;
  }
  
  try {
    await logExport(fileName, "PDF");
  } catch (err) {
    console.warn("Failed to log PDF export:", err);
  }
}

/**
 * Exports JSON data to CSV
 * @param data Array of objects
 * @param fileName Name of the file
 */
export async function exportToCSV(data: any[], fileName: string) {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  try {
    await logExport(fileName, "CSV");
  } catch (err) {
    console.warn("Failed to log CSV export:", err);
  }
}

/**
 * Exports JSON data to Excel
 * @param data Array of objects
 * @param fileName Name of the file
 */
export function exportToExcel(data: any[], fileName: string) {
  // Currently falls back to CSV using PapaParse due to XLSX vulnerability
  console.log("Excel export is a future enhancement. Falling back to CSV export.");
  exportToCSV(data, fileName);
}

/**
 * Logs the export action to the backend
 */
async function logExport(fileName: string, format: string) {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;
    await fetch("/api/exports/log", {
      method: "POST",
      credentials: "include",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        fileName,
        format,
        documentType: "Report"
      })
    });
  } catch (err) {
    console.warn("Failed to log export", err);
  }
}
