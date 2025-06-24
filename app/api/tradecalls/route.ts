import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import TradeCall from "@/models/TradeCall"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const userPayload = getUserFromRequest(request)
    if (!userPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const skip = Number.parseInt(searchParams.get("skip") || "0")

    await dbConnect()

    const tradeCalls = await TradeCall.find({ userId: userPayload.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await TradeCall.countDocuments({ userId: userPayload.userId })

    return NextResponse.json({
      success: true,
      tradeCalls: tradeCalls.map((call) => ({
        ...call.toObject(),
        _id: call._id.toString(),
      })),
      total,
      hasMore: skip + limit < total,
    })
  } catch (error) {
    console.error("Get trade calls error:", error)
    return NextResponse.json({ error: "Failed to fetch trade calls" }, { status: 500 })
  }
}
