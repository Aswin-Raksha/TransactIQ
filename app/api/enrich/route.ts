import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { batchEnrichRecords } from "@/lib/ai-enrichment"
import type { SpendRecord } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { records }: { records: SpendRecord[] } = await request.json()

    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ error: "Invalid records data" }, { status: 400 })
    }

    // Enrich records using AI
    const enrichedRecords = await batchEnrichRecords(records)

    // Save to MongoDB
    const db = await getDatabase()
    const collection = db.collection("spend_records")

    const result = await collection.insertMany(enrichedRecords)

    return NextResponse.json({
      success: true,
      enrichedRecords,
      insertedCount: result.insertedCount,
    })
  } catch (error) {
    console.error("Enrichment error:", error)
    return NextResponse.json({ error: "Failed to enrich records" }, { status: 500 })
  }
}
