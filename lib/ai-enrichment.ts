import type { SpendRecord } from "./types"

// Placeholder categories - in production, this would be a comprehensive taxonomy
const CATEGORIES = {
  "IT Hardware": ["computer", "laptop", "server", "equipment", "apple", "dell", "hp"],
  "Professional Services": ["consulting", "advisory", "services", "audit"],
  "Office Supplies": ["supplies", "paper", "stationery", "office"],
  Software: ["software", "license", "subscription", "saas"],
  "Travel & Entertainment": ["travel", "hotel", "flight", "meal", "entertainment"],
  Marketing: ["marketing", "advertising", "promotion", "campaign"],
  Facilities: ["rent", "utilities", "maintenance", "cleaning"],
}

const VENDOR_NORMALIZATIONS: { [key: string]: string } = {
  appl: "Apple Inc.",
  apple: "Apple Inc.",
  msft: "Microsoft Corporation",
  microsoft: "Microsoft Corporation",
  amzn: "Amazon.com Inc.",
  amazon: "Amazon.com Inc.",
  googl: "Google LLC",
  google: "Google LLC",
}

export async function enrichSpendRecord(record: SpendRecord): Promise<SpendRecord> {
  // Simulate AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const description = record.originalDescription.toLowerCase()

  // Category classification
  let bestCategory = "Uncategorized"
  let maxMatches = 0

  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    const matches = keywords.filter((keyword) => description.includes(keyword)).length
    if (matches > maxMatches) {
      maxMatches = matches
      bestCategory = category
    }
  }

  // Vendor normalization
  let normalizedVendor = record.rawVendor || ""
  for (const [pattern, normalized] of Object.entries(VENDOR_NORMALIZATIONS)) {
    if (description.includes(pattern)) {
      normalizedVendor = normalized
      break
    }
  }

  // Generate enriched description
  let enrichedDescription = record.originalDescription
  if (description.includes("appl") || description.includes("apple")) {
    enrichedDescription = "MacBooks and accessories for development team"
  } else if (description.includes("consulting")) {
    enrichedDescription = "Strategic consulting services for digital transformation"
  }

  // Generate tags
  const tags: string[] = []
  if (description.includes("consulting") || description.includes("advisory")) {
    tags.push("Digital Strategy", "One-time Project")
  }
  if (description.includes("equipment") || description.includes("hardware")) {
    tags.push("Capital Expenditure", "IT Infrastructure")
  }

  return {
    ...record,
    category: bestCategory,
    normalizedVendor,
    enrichedDescription,
    tags,
    confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
    status: "enriched",
    enrichedAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function batchEnrichRecords(records: SpendRecord[]): Promise<SpendRecord[]> {
  const enrichedRecords: SpendRecord[] = []

  for (const record of records) {
    const enriched = await enrichSpendRecord(record)
    enrichedRecords.push(enriched)
  }

  return enrichedRecords
}
