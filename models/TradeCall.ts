import mongoose from "mongoose"

const TradeCallSchema = new mongoose.Schema({
  transType: {
    type: String,
    required: true,
  },
  tradingSymbol: {
    type: String,
    required: true,
  },
  expiryDate: {
    type: String,
    default: "",
  },
  priceLowerBound: {
    type: String,
    required: true,
  },
  priceUpperBound: {
    type: String,
    required: true,
  },
  targetLowerBound: {
    type: String,
    required: true,
  },
  targetUpperBound: {
    type: String,
    required: true,
  },
  stoplossLowerBound: {
    type: String,
    required: true,
  },
  stoplossUpperBound: {
    type: String,
    required: true,
  },
  originalInput: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.models.TradeCall || mongoose.model("TradeCall", TradeCallSchema)
