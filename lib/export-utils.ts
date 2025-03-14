import * as XLSX from "xlsx"

export function exportToExcel(data, fileName) {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data")

  // Set column widths
  const colWidths = []
  if (data.length > 0) {
    const firstRow = data[0]
    Object.keys(firstRow).forEach((key) => {
      // Estimate width based on header length and content
      const maxContentLength = Math.max(key.length, ...data.map((row) => String(row[key] || "").length))
      colWidths.push({ wch: Math.min(Math.max(10, maxContentLength + 2), 50) })
    })
    worksheet["!cols"] = colWidths
  }

  // Generate Excel file
  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split("T")[0]}.xlsx`)
}

