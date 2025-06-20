import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDatabase()
    const collection = db.collection("spend_records")

    const totalRecords = await collection.countDocuments()
    const enrichedRecords = await collection.countDocuments({ status: "enriched" })

    // Category breakdown
    const categoryPipeline = [
      { $match: { category: { $exists: true, $ne: null } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]

    const categoryResults = await collection.aggregate(categoryPipeline).toArray()
    const categoryBreakdown = categoryResults.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {})

    // Vendor frequency
    const vendorPipeline = [
      { $match: { normalizedVendor: { $exists: true, $ne: null, $ne: "" } } },
      { $group: { _id: "$normalizedVendor", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]

    const vendorResults = await collection.aggregate(vendorPipeline).toArray()
    const vendorFrequency = vendorResults.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {})

    // Average confidence
    const confidenceResult = await collection
      .aggregate([
        { $match: { confidence: { $exists: true } } },
        { $group: { _id: null, avgConfidence: { $avg: "$confidence" } } },
      ])
      .toArray()

    const averageConfidence = confidenceResult[0]?.avgConfidence || 0

    return NextResponse.json({
      totalRecords,
      enrichedRecords,
      averageConfidence,
      categoryBreakdown,
      vendorFrequency,
    })
  } catch (error) {
    console.error("Metrics error:", error)
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
  }
}
