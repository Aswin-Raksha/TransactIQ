import { type NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { processFileBuffer } from "@/lib/file-processors"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const userPayload = getUserFromRequest(request)
    if (!userPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    // Convert file to buffer and process
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const processedFile = await processFileBuffer(buffer, file.name)

    // Create a specialized prompt based on file type
    let systemPrompt = "You are an expert document analyzer. Provide a comprehensive analysis of the uploaded content."

    switch (processedFile.type) {
      case "csv":
        systemPrompt =
          "You are a data analyst. Analyze the CSV data provided and give insights about patterns, trends, and key findings. Provide statistical summaries where relevant."
        break
      case "pdf":
        systemPrompt =
          "You are a document analyst. Analyze the PDF content and provide a comprehensive summary, key points, and insights."
        break
      case "docx":
        systemPrompt =
          "You are a document reviewer. Analyze the Word document content and provide a detailed summary, main themes, and key insights."
        break
      case "text":
        systemPrompt =
          "You are a text analyst. Analyze the text content and provide insights, themes, sentiment analysis, and key takeaways."
        break
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Please analyze the following ${processedFile.type} file content from "${processedFile.filename}":\n\n${processedFile.content}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 3000,
    })

    const analysis = response.choices[0]?.message?.content || "I apologize, but I couldn't analyze the file content."

    // Generate a summary for CSV export
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Provide a brief 2-3 sentence summary of the analysis.",
        },
        {
          role: "user",
          content: analysis,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    })

    const summary = summaryResponse.choices[0]?.message?.content || "Analysis completed."

    return NextResponse.json({
      analysis,
      summary,
      filename: processedFile.filename,
      type: processedFile.type,
      processedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("File processing error:", error)
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 })
  }
}
