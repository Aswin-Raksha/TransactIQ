export function validatePayload(data: any) {
  // Ensure all expected keys are present
  const requiredFields = [
    "transType",
    "tradingSymbol",
    "expiryDate",
    "priceLowerBound",
    "priceUpperBound",
    "targetLowerBound",
    "targetUpperBound",
    "stoplossLowerBound",
    "stoplossUpperBound",
  ]

  for (const field of requiredFields) {
    if (!(field in data)) {
      data[field] = "Invalid Input"
    }
  }

  // Normalize transType for logic
  const tType = data.transType.toLowerCase()

  // Helper to convert to int if valid
  function parseValue(value: string): number | null {
    try {
      const parsed = Number.parseInt(value)
      return isNaN(parsed) ? null : parsed
    } catch {
      return null
    }
  }

  // Prepare numeric fields
  const tl = data.targetLowerBound !== "Invalid Input" ? parseValue(data.targetLowerBound) : null
  const tu = data.targetUpperBound !== "Invalid Input" ? parseValue(data.targetUpperBound) : null
  const sl = data.stoplossLowerBound !== "Invalid Input" ? parseValue(data.stoplossLowerBound) : null
  const su = data.stoplossUpperBound !== "Invalid Input" ? parseValue(data.stoplossUpperBound) : null

  // Invalidate partially valid fields
  if ((tl === null && tu !== null) || (tu === null && tl !== null)) {
    data.targetLowerBound = "Invalid Input"
    data.targetUpperBound = "Invalid Input"
  }

  if ((sl === null && su !== null) || (su === null && sl !== null)) {
    data.stoplossLowerBound = "Invalid Input"
    data.stoplossUpperBound = "Invalid Input"
  }

  // Apply Target logic
  if (tl !== null && tu !== null) {
    if (tType === "buy" && tl > tu) {
      data.targetLowerBound = "Invalid Input"
      data.targetUpperBound = "Invalid Input"
    } else if (tType === "sell" && tl < tu) {
      data.targetLowerBound = "Invalid Input"
      data.targetUpperBound = "Invalid Input"
    }
  }

  // Apply Stoploss logic
  if (sl !== null && su !== null) {
    if (tType === "buy" && sl > su) {
      data.stoplossLowerBound = "Invalid Input"
      data.stoplossUpperBound = "Invalid Input"
    } else if (tType === "sell" && sl < su) {
      data.stoplossLowerBound = "Invalid Input"
      data.stoplossUpperBound = "Invalid Input"
    }
  }

  return data
}
