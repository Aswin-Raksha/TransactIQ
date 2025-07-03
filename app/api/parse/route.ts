import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import dbConnect from "@/lib/mongodb"
import TradeCall from "@/models/TradeCall"
import { validatePayload } from "@/lib/validation"
import { getUserFromRequest } from "@/lib/auth"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const userPayload = getUserFromRequest(request)
    if (!userPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tradeCall } = await request.json()

    if (!tradeCall) {
      return NextResponse.json({ error: "Trade call is required" }, { status: 400 })
    }

    // Connect to MongoDB
    await dbConnect()

    // Get current date for GPT prompt
    const currentDate = new Date().toISOString().split("T")[0]

    // Create the detailed prompt based on the Python code
    const prompt = `
Today is ${currentDate}.

You are an expert AI assistant specialized in generating trade call API payloads. Your task is to extract details from the following natural language trade call and output a JSON object exactly matching the specified format below. Do not include extra keys, commentary, or explanations—output only the requested JSON object.

Required JSON Format:
{
  "transType": "<Buy or Sell>",
  "tradingSymbol": "<Normalized Scrip Name (e.g., TATAMOTORS, NIFTY 23000 CE)>",
  "expiryDate": "<YYYY-MM-DD if mentioned (weekly/monthly/yearly) relative to today's date; otherwise empty>",
  "priceLowerBound": "<Price Lower Bound>",
  "priceUpperBound": "<Price Upper Bound>",
  "targetLowerBound": "<Target Lower Bound>",
  "targetUpperBound": "<Target Upper Bound>",
  "stoplossLowerBound": "<Stoploss Lower Bound>",
  "stoplossUpperBound": "<Stoploss Upper Bound>"
}

Guidelines for Extraction:

1. Trade Type (transType):
   - Normalize clearly ("Buy", "B", "Bu" → "Buy"; "Sell", "S", "Sel" → "Sell").

2. Scrip Name (tradingSymbol):
   - Clearly normalize abbreviations ("nift" → "NIFTY").
   - Convert numeric abbreviations ("640k" → "640000"), format properly ("NIFTY 640000 CE").

3. Expiry Date (expiryDate):
   - Calculate relative to today's date (${currentDate}):
     - "weekly" → 7 days
     - "monthly" → 30 days
     - "yearly" → 365 days
   - If no keyword, leave expiryDate empty.

4. Price Fields:
   - Single numeric value provided: use for both upper and lower bounds.
   - Do NOT reorder or sort numerically. Never reorder Stoploss or Target bounds.

5. CRITICAL - Explicit Logic for Targets & Stop Loss:

When two numbers appear as X/Y, apply the logic strictly based on **trade type** and **field** (Target or Stoploss).  
Absolutely no reordering, flipping, correction, or assumptions are allowed.

"Append Logic" Rules:
- Only apply if second number has **fewer digits**:
  - "200/20" → 200/220
  - "240/70" → 240/270
  - "940/75" → 940/975
  - "1550/80" → 1550/1580
- If second number has equal or greater digits, treat it as explicit numeric value:
  - "240/120" is **not** 240/360 → It must follow strict table logic above & treat it as explicit numeric value.
  
If the logic is violated or interpretation is unclear, return "Invalid Input" for that field explicitly.

STRICT Prohibited Behaviors:
- DO NOT swap, reorder, or assume numerical correction.
- DO NOT infer intended direction of range. Maintain the order given.
- DO NOT hallucinate or fabricate missing fields.
- Only use append logic when second value has strictly fewer digits.
- When values violate the trade-specific logic table, set both bounds to "Invalid Input".

User Input: "${tradeCall}"
`

    // Call OpenAI GPT-3.5-turbo (free model)
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an expert AI assistant specialized in generating trade call API payloads. Your task is to extract all relevant details from a natural language trade call and produce a JSON object that exactly follows the specified format. Adhere strictly to the guidelines, compute expiry dates based on contract type keywords (weekly, monthly, yearly) relative to today's date, and output only valid JSON. This is a deterministic rule-based system. Do NOT 'fix' or 'intelligently interpret' potential human mistakes. Apply rules exactly as instructed — no more, no less.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 2500,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    })

    const rawData = response.choices[0].message.content
    console.log("LLM Result:", rawData)

    // Parse JSON response
    let parsedJSON
    try {
      parsedJSON = JSON.parse(rawData?.trim() || "")
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError)
      return NextResponse.json(
        {
          error: "Failed to parse GPT response as JSON",
          rawResponse: rawData,
        },
        { status: 500 },
      )
    }

    // Validate the payload using the same logic as Python
    const validatedJSON = validatePayload(parsedJSON)
    console.log("Post Validated Results:", validatedJSON)

    // Save to MongoDB with user reference
    const tradeCallDoc = new TradeCall({
      ...validatedJSON,
      originalInput: tradeCall,
      userId: userPayload.userId,
    })

    await tradeCallDoc.save()

    return NextResponse.json({
      success: true,
      data: validatedJSON,
      rawGptResponse: rawData,
      message: "Trade call parsed and saved successfully",
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      {
        error: "Failed to process trade call",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
