export interface SpendRecord {
  _id?: string
  originalDescription: string
  amount?: number
  date?: string
  rawVendor?: string

  // AI-enriched fields
  category?: string
  subcategory?: string
  normalizedVendor?: string
  enrichedDescription?: string
  tags?: string[]
  confidence?: number

  // Metadata
  createdAt?: Date
  updatedAt?: Date
  enrichedAt?: Date
  status: "pending" | "enriched" | "reviewed"
}

export interface EnrichmentMetrics {
  totalRecords: number
  enrichedRecords: number
  averageConfidence: number
  categoryBreakdown: { [key: string]: number }
  vendorFrequency: { [key: string]: number }
}

export interface UploadData {
  records: SpendRecord[]
  fileName?: string
}
