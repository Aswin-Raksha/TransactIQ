import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import TradeCall from "@/models/TradeCall"

export async function GET(request: Request) {
  try {
    await dbConnect()

    const totalTradeCalls = await TradeCall.countDocuments()

    const totalProfit = await TradeCall.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$profit" },
        },
      },
    ])

    const totalLoss = await TradeCall.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$loss" },
        },
      },
    ])

    const totalTrades = await TradeCall.countDocuments()

    const winningTrades = await TradeCall.countDocuments({
      profit: { $gt: 0 },
    })

    const losingTrades = await TradeCall.countDocuments({ loss: { $gt: 0 } })

    const profitableAssets = await TradeCall.aggregate([
      {
        $group: {
          _id: "$asset",
          totalProfit: { $sum: "$profit" },
        },
      },
      {
        $sort: {
          totalProfit: -1,
        },
      },
      {
        $limit: 5,
      },
    ])

    const losingAssets = await TradeCall.aggregate([
      {
        $group: {
          _id: "$asset",
          totalLoss: { $sum: "$loss" },
        },
      },
      {
        $sort: {
          totalLoss: -1,
        },
      },
      {
        $limit: 5,
      },
    ])

    const totalProfitValue = totalProfit.length > 0 ? totalProfit[0].total : 0
    const totalLossValue = totalLoss.length > 0 ? totalLoss[0].total : 0

    return NextResponse.json({
      totalTradeCalls,
      totalProfit: totalProfitValue,
      totalLoss: totalLossValue,
      totalTrades,
      winningTrades,
      losingTrades,
      profitableAssets,
      losingAssets,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
