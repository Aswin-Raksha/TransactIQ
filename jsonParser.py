import datetime
import openai
import json

def get_api_key():
    try:
        with open('apiKey.bin', 'r') as f:
            return f.read().strip()
    except:
        try:
            with open('/home/ec2-user/Codifi/tradePayload/consoleApp/apiKey.bin', 'r') as f:
                return f.read().strip()
        except FileNotFoundError:
            raise FileNotFoundError("apiKey.bin not found in either default or fallback path.")

apiKey = get_api_key()
openai.api_key = apiKey

def query_gpt_4o_mini(query: str):
    current_date = datetime.date.today().strftime('%Y-%m-%d')
    prompt = f"""
Today is {current_date}.

You are an expert AI assistant specialized in generating trade call API payloads. Your task is to extract details from the following natural language trade call and output a JSON object exactly matching the specified format below. Do not include extra keys, commentary, or explanations—output only the requested JSON object.

Required JSON Format:
{{
  "transType": "<Buy or Sell>",
  "tradingSymbol": "<Normalized Scrip Name (e.g., TATAMOTORS, NIFTY 23000 CE)>",
  "expiryDate": "<YYYY-MM-DD if mentioned (weekly/monthly/yearly) relative to today's date; otherwise empty>",
  "priceLowerBound": "<Price Lower Bound>",
  "priceUpperBound": "<Price Upper Bound>",
  "targetLowerBound": "<Target Lower Bound>",
  "targetUpperBound": "<Target Upper Bound>",
  "stoplossLowerBound": "<Stoploss Lower Bound>",
  "stoplossUpperBound": "<Stoploss Upper Bound>"
}}

Guidelines for Extraction:

1. Trade Type (transType):
   - Normalize clearly ("Buy", "B", "Bu" → "Buy"; "Sell", "S", "Sel" → "Sell").

2. Scrip Name (tradingSymbol):
   - Clearly normalize abbreviations ("nift" → "NIFTY").
   - Convert numeric abbreviations ("640k" → "640000"), format properly ("NIFTY 640000 CE").

3. Expiry Date (expiryDate):
   - Calculate relative to today's date ({current_date}):
     - "weekly" → 7 days
     - "monthly" → 30 days
     - "yearly" → 365 days
   - If no keyword, leave expiryDate empty.

4. Price Fields:
   - Single numeric value provided: use for both upper and lower bounds.
   - Do NOT reorder or sort numerically. Never reorder Stoploss or Target bounds.[The should be no reordering in StopLoss & TagetLevel]

5. CRITICAL - Explicit Logic for Targets & Stop Loss:

When two numbers appear as `X/Y`, apply the logic strictly based on **trade type** and **field** (Target or Stoploss).  
Absolutely no reordering, flipping, correction, or assumptions are allowed.

| Trade Type | Field  | Input       | Condition / Rule                                           | Interpretation                         |
|------------|--------|-------------|------------------------------------------------------------|----------------------------------------|
| **Buy**    | Target | `200/20`     | Append valid → Y has fewer digits                         | Lower = 200, Upper = 220 (append)      |
| **Buy**    | Target | `240/70`     | Append valid → Y has fewer digits                         | Lower = 240, Upper = 270 (append)      |
| **Buy**    | Target | `240/120`    | Equal digits; X > Y → ❌ Invalid                          | "Invalid Input"                        |
| **Buy**    | Target | `940/75`     | Append valid → Y has fewer digits                         | Lower = 940, Upper = 975 (append)      |
| **Buy**    | Target | `610/590`    | Equal digits; X > Y → ❌ Invalid                          | "Invalid Input"                        |
| **Buy**    | SL     | `120/110`    | Explicit (preserve order)                                 | Upper = 120, Lower = 110               |
| **Buy**    | SL     | `240/120`    | Explicit (preserve order)                                 | Upper = 240, Lower = 120               |
| **Buy**    | SL     | `940/75`     | Append valid → Y has fewer digits                         | Upper = 940, Lower = 975 (append)      |
| **Buy**    | SL     | `940/120`    | X < Y → ❌ Invalid                                         | "Invalid Input"                        |
| **Sell**   | Target | `240/120`    | Explicit (preserve order)                                 | Lower = 240, Upper = 120               |
| **Sell**   | Target | `1550/80`    | Append valid → Y has fewer digits                         | Lower = 1550, Upper = 1580 (append)    |
| **Sell**   | Target | `900/910`    | X < Y → ❌ Invalid                                         | "Invalid Input"                        |
| **Sell**   | SL     | `1480/70`    | Append valid → Y has fewer digits                         | Upper = 1480, Lower = 1470 (append)    |
| **Sell**   | SL     | `120/20`     | X < Y → ❌ Invalid                                         | "Invalid Input"                        |
| **Sell**   | SL     | `940/75`     | Append valid → Y has fewer digits                         | Upper = 940, Lower = 975 (append)      |
| **Sell**   | SL     | `940/120`    | X < Y → ❌ Invalid                                         | "Invalid Input"                        |

---

Additional Clarification for Ambiguous Input:
These rules must be strictly followed — do NOT perform reordering, correction, or numeric flipping of any kind.
- For inputs like `240/120`, interpretation must follow:
  - **Buy Target**: Invalid Input → First value is greater than second. Reject.
  - **Buy SL**: Valid → Upper = 240, Lower = 120.
  - **Sell Target**: Valid → Lower = 240, Upper = 120.
  - **Sell SL**: Invalid Input → First value is smaller than second. Reject.
following rules must be strictly followed when interpreting input of the form `X/Y` (e.g., `240/120`). No assumptions, corrections, or value flipping are allowed.

These rules must be **strictly followed** — no value flipping, reordering, or assumptions allowed.
Buy Transactions
- **Buy Target**
  - If `X > Y`: ❌ Reject — Invalid input (target must be ascending)
- **Buy SL (Stop Loss)**
  - If `X > Y`: ✅ Valid — Interpret as: `Upper = X`, `Lower = Y`

for Sell Transactions
- **Sell Target**
  - If `X > Y`:  Valid — Interpret as: `Lower = X`, `Upper = Y`
- **Sell SL (Stop Loss)**
  - If `X > Y`:  Reject — Invalid input (stop loss must be descending)


"Append Logic" Rules:
- Only apply if second number has **fewer digits**:
  - "200/20" → 200/220
  - "240/70" → 240/270
  - "940/75" → 940/975
  - "1550/80" → 1550/1580
look for this scenerio for both StopLoss & TagetLevel
- If second number has equal or greater digits, treat it as explicit numeric value:
  - "240/120" is **not** 240/360 → It must follow strict table logic above & treat it as explicit numeric value.
  
If the logic is violated or interpretation is unclear, return `"Invalid Input"` for that field explicitly.

---

Note on "append":  
- If the second number has fewer digits, it's considered trailing digits for the upper bound (e.g., "200/20" → 200/220, "1550/80" → 1550/1580).
- If the second number has equal or greater digits than the first, treat it as explicit numeric value.

Examples to illustrate clearly:

Example 1 (Valid Buy):
Input: "Buy NIFTY 23000 CE monthly @160 target 200/20 SL 120/110"  
Expected Output:
{{
  "transType": "Buy",
  "tradingSymbol": "NIFTY 23000 CE",
  "expiryDate": "<one month from {current_date}>",
  "priceLowerBound": "160",
  "priceUpperBound": "160",
  "targetLowerBound": "200",
  "targetUpperBound": "220",
  "stoplossLowerBound": "110",
  "stoplossUpperBound": "120"
}}

Example 2 (Invalid Buy Target):
Input: "Buy tatamotors @740 target 240/120 SL 740/20"  
Expected Output:
{{
  "transType": "Buy",
  "tradingSymbol": "TATAMOTORS",
  "expiryDate": "",
  "priceLowerBound": "740",
  "priceUpperBound": "740",
  "targetLowerBound": "Invalid Input",
  "targetUpperBound": "Invalid Input",
  "stoplossLowerBound": "20",
  "stoplossUpperBound": "740"
}}

Example 3 (Valid Sell Target):
Input: "Sell tatamotors at 1500 with target 240/120 and SL 1480/70"  
Expected Output:
{{
  "transType": "Sell",
  "tradingSymbol": "TATAMOTORS",
  "expiryDate": "",
  "priceLowerBound": "1500",
  "priceUpperBound": "1500",
  "targetLowerBound": "240",
  "targetUpperBound": "120",
  "stoplossLowerBound": "1470",
  "stoplossUpperBound": "1480"
}}

Example 4 (Invalid Sell SL):
Input: "Sell NIFTY 640k call yearly @850 target 900/910 SL 120/20"  
Expected Output:
{{
  "transType": "Sell",
  "tradingSymbol": "NIFTY 640000 CE",
  "expiryDate": "<one year from {current_date}>",
  "priceLowerBound": "850",
  "priceUpperBound": "850",
  "targetLowerBound": "900",
  "targetUpperBound": "910",
  "stoplossLowerBound": "Invalid Input",
  "stoplossUpperBound": "Invalid Input"
}}

Example 5 (Simple Sell scenario):
Input: "Sell NIFTY call weekly @1020 target 1050 SL 1000"  
Expected Output:
{{
  "transType": "Sell",
  "tradingSymbol": "NIFTY 23000 CE",
  "expiryDate": "<one week from {current_date}>",
  "priceLowerBound": "1020",
  "priceUpperBound": "1020",
  "targetLowerBound": "1050",
  "targetUpperBound": "1050",
  "stoplossLowerBound": "1000",
  "stoplossUpperBound": "1000"
}}

Example 6 (Mixed-length numeric input):
Input: "Buy INFY monthly @1350 target 1375/90 SL 1330/20"
Expected Output:
{{
  "transType": "Buy",
  "tradingSymbol": "INFY",
  "expiryDate": "<one month from {current_date}>",
  "priceLowerBound": "1350",
  "priceUpperBound": "1350",
  "targetLowerBound": "1375",
  "targetUpperBound": "1390",
  "stoplossLowerBound": "1320",
  "stoplossUpperBound": "1330"
}}

Example 7 (Explicit numeric bounds):
Input: "Sell HDFCBANK weekly @1650 target 1640/1620 SL 1660/1680"
Expected Output:
{{
  "transType": "Sell",
  "tradingSymbol": "HDFCBANK",
  "expiryDate": "<one week from {current_date}>",
  "priceLowerBound": "1650",
  "priceUpperBound": "1650",
  "targetLowerBound": "1640",
  "targetUpperBound": "1620",
  "stoplossLowerBound": "1660",
  "stoplossUpperBound": "1680"
}}

Example 8 (Clearly invalid numeric scenario):
Input: "Buy SBIN @600 target 610/590 SL 595/605"
Expected Output:
{{
  "transType": "Buy",
  "tradingSymbol": "SBIN",
  "expiryDate": "",
  "priceLowerBound": "600",
  "priceUpperBound": "600",
  "targetLowerBound": "Invalid Input",
  "targetUpperBound": "Invalid Input",
  "stoplossLowerBound": "595",
  "stoplossUpperBound": "605"
}}

Example 9 (Ambiguous SL - Do Not Flip):
Input: "Buy HDFC weekly @160 target 200/20 SL 940/25"
Expected Output:
{{
  "transType": "Buy",
  "tradingSymbol": "HDFC",
  "expiryDate": "<one week from {current_date}>",
  "priceLowerBound": "160",
  "priceUpperBound": "160",
  "targetLowerBound": "200",
  "targetUpperBound": "220",
  "stoplossLowerBound": "940",
  "stoplossUpperBound": "925"
}}

Example 10 (Invalid BUY SL - Do Not Flip):
Input: "Buy HDFC weekly @160 target 200/20 SL 970/25"
Expected Output:
{{
  "transType": "Buy",
  "tradingSymbol": "HDFC",
  "expiryDate": "<one week from {current_date}>",
  "priceLowerBound": "160",
  "priceUpperBound": "160",
  "targetLowerBound": "200",
  "targetUpperBound": "220",
  "stoplossLowerBound": "Invalid Input",
  "stoplossUpperBound": "Invalid Input"
}}

Anti-Hallucination & Explicit Instructions:
- Follow numeric logic exactly as defined above based explicitly on trade type.
- Do NOT perform addition or subtraction.
- NEVER reorder numbers numerically.
- If input is unclear or violates logic, explicitly return "Invalid Input".

STRICT Prohibited Behaviors:
-  DO NOT swap, reorder, or assume numerical correction.
-  DO NOT infer intended direction of range. Maintain the order given.
-  DO NOT hallucinate or fabricate missing fields.
-  Only use append logic when second value has strictly fewer digits.
-  When values violate the trade-specific logic table, set both bounds to `"Invalid Input"`.


User Input: "{query}"
"""

    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert AI assistant specialized in generating trade call API payloads. "
                    "Your task is to extract all relevant details from a natural language trade call and produce a JSON object that exactly follows the specified format. "
                    "Adhere strictly to the guidelines, compute expiry dates based on contract type keywords (weekly, monthly, yearly) relative to today's date, and output only valid JSON."
                    "This is a deterministic rule-based system. Do NOT 'fix' or 'intelligently interpret' potential human mistakes. Apply rules exactly as instructed — no more, no less."
                )
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        max_tokens=2500,
        top_p=1.0,
        frequency_penalty=0.0,
        presence_penalty=0.0,
    )
    return response['choices'][0]['message']['content']

def validate_payload(data):
    # Ensure all expected keys are present
    required_fields = [
        "transType", "tradingSymbol", "expiryDate",
        "priceLowerBound", "priceUpperBound",
        "targetLowerBound", "targetUpperBound",
        "stoplossLowerBound", "stoplossUpperBound"
    ]

    for field in required_fields:
        if field not in data:
            data[field] = "Invalid Input"

    # Normalize transType for logic
    t_type = data["transType"].lower()

    # Helper to convert to int if valid
    def parse(value):
        try:
            return int(value)
        except:
            return None

    # Prepare numeric fields
    tl = parse(data["targetLowerBound"]) if data["targetLowerBound"] != "Invalid Input" else None
    tu = parse(data["targetUpperBound"]) if data["targetUpperBound"] != "Invalid Input" else None
    sl = parse(data["stoplossLowerBound"]) if data["stoplossLowerBound"] != "Invalid Input" else None
    su = parse(data["stoplossUpperBound"]) if data["stoplossUpperBound"] != "Invalid Input" else None

    # Invalidate partially valid fields
    if (tl is None and tu is not None) or (tu is None and tl is not None):
        data["targetLowerBound"] = "Invalid Input"
        data["targetUpperBound"] = "Invalid Input"

    if (sl is None and su is not None) or (su is None and sl is not None):
        data["stoplossLowerBound"] = "Invalid Input"
        data["stoplossUpperBound"] = "Invalid Input"

    # Apply Target logic
    if tl is not None and tu is not None:
        if t_type == "buy" and tl > tu:
            data["targetLowerBound"] = "Invalid Input"
            data["targetUpperBound"] = "Invalid Input"
        elif t_type == "sell" and tl < tu:
            data["targetLowerBound"] = "Invalid Input"
            data["targetUpperBound"] = "Invalid Input"

    # Apply Stoploss logic
    if sl is not None and su is not None:
        if t_type == "buy" and sl > su:
            data["stoplossLowerBound"] = "Invalid Input"
            data["stoplossUpperBound"] = "Invalid Input"
        elif t_type == "sell" and sl < su:
            data["stoplossLowerBound"] = "Invalid Input"
            data["stoplossUpperBound"] = "Invalid Input"

    return data


while True:
    x = str(input("Enter Trade Call: "))
    rawData = query_gpt_4o_mini(x)

    print("LLM Result: ", rawData)
    print("\n\n\n")

    parsedJSON = json.loads(rawData.strip())
    validatedJSON = validate_payload(parsedJSON)

    print("Post Validated Results:", validatedJSON)
    print("\n\n")