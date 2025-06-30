// Server-side file processing utilities
import { parse } from "csv-parse/sync"

export interface ProcessedFile {
  content: string
  type: string
  filename: string
}

export async function processTextFile(buffer: Buffer): Promise<string> {
  return buffer.toString("utf-8")
}

export async function processCsvFile(buffer: Buffer): Promise<string> {
  const content = buffer.toString("utf-8")
  try {
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    })

    // Convert CSV to readable text format
    const textContent = records
      .map((record: any) => {
        return Object.entries(record)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ")
      })
      .join("\n")

    return textContent
  } catch (error) {
    throw new Error("Failed to parse CSV file")
  }
}

export async function processPdfFile(buffer: Buffer): Promise<string> {
  try {
    // For now, we'll use a simple text extraction
    // In production, you'd use pdf-parse on the server
    const text = buffer.toString("utf-8")

    // Simple text extraction (placeholder)
    const extractedText = text
      .replace(/[^\x20-\x7E\n]/g, " ")
      .split("\n")
      .filter((line) => line.trim().length > 10)
      .join("\n")

    return (
      extractedText || "PDF text extraction requires server-side processing. Please copy and paste the text content."
    )
  } catch (error) {
    throw new Error("Failed to parse PDF file")
  }
}

export async function processWordFile(buffer: Buffer): Promise<string> {
  try {
    // For now, we'll use a simple text extraction
    // In production, you'd use mammoth on the server
    const text = buffer.toString("utf-8")

    // Simple text extraction (placeholder)
    const extractedText = text
      .replace(/[^\x20-\x7E\n]/g, " ")
      .split("\n")
      .filter((line) => line.trim().length > 5)
      .join("\n")

    return (
      extractedText ||
      "Word document text extraction requires server-side processing. Please copy and paste the text content."
    )
  } catch (error) {
    throw new Error("Failed to parse Word document")
  }
}

export async function processFileBuffer(buffer: Buffer, filename: string): Promise<ProcessedFile> {
  const extension = filename.split(".").pop()?.toLowerCase()

  let content: string
  let type: string

  switch (extension) {
    case "txt":
      content = await processTextFile(buffer)
      type = "text"
      break
    case "csv":
      content = await processCsvFile(buffer)
      type = "csv"
      break
    case "pdf":
      content = await processPdfFile(buffer)
      type = "pdf"
      break
    case "docx":
    case "doc":
      content = await processWordFile(buffer)
      type = "docx"
      break
    default:
      throw new Error(`Unsupported file type: ${extension}`)
  }

  return {
    content,
    type,
    filename,
  }
}
