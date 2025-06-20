"use client"

import type React from "react"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Upload, FileText, Loader2, Download } from "lucide-react"
import type { SpendRecord } from "@/lib/types"

export default function UploadPage() {
  const [records, setRecords] = useState<SpendRecord[]>([])
  const [enrichedRecords, setEnrichedRecords] = useState<SpendRecord[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [textInput, setTextInput] = useState("")


  const handleTextSubmit = () => {
    if (!textInput.trim()) {
      toast.error("Please enter some spend data")

      return
    }

    const lines = textInput.split("\n").filter((line) => line.trim())
    const newRecords: SpendRecord[] = lines.map((line, index) => ({
      originalDescription: line.trim(),
      status: "pending" as const,
      createdAt: new Date(),
    }))

    setRecords(newRecords)
    toast.success(`${newRecords.length} records prepared for analysis`)

  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split("\n").filter((line) => line.trim())

      // Skip header if it looks like CSV
      const dataLines = lines[0].includes(",") ? lines.slice(1) : lines

      const newRecords: SpendRecord[] = dataLines.map((line) => {
        const parts = line.split(",")
        return {
          originalDescription: parts[0]?.trim() || line.trim(),
          amount: parts[1] ? Number.parseFloat(parts[1]) : undefined,
          rawVendor: parts[2]?.trim(),
          status: "pending" as const,
          createdAt: new Date(),
        }
      })

      setRecords(newRecords)
      toast.success(`${newRecords.length} records loaded from ${file.name}`, {
  description: "File uploaded",
})

    }
    reader.readAsText(file)
  }

  const handleEnrichment = async () => {
    if (records.length === 0) {
      toast.error("Please enter some spend data")

      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      })

      if (!response.ok) {
        throw new Error("Failed to enrich records")
      }

      const data = await response.json()
      setEnrichedRecords(data.enrichedRecords)

      toast.success("Success", {
  description: `${data.enrichedRecords.length} records enriched and saved`,
})

    } catch (error) {
      toast.error("Please enter some spend data")

    } finally {
      setIsProcessing(false)
    }
  }

  const exportToCSV = () => {
    if (enrichedRecords.length === 0) return

    const headers = [
      "Original Description",
      "Category",
      "Normalized Vendor",
      "Enriched Description",
      "Tags",
      "Confidence",
      "Amount",
    ]

    const csvContent = [
      headers.join(","),
      ...enrichedRecords.map((record) =>
        [
          `"${record.originalDescription}"`,
          `"${record.category || ""}"`,
          `"${record.normalizedVendor || ""}"`,
          `"${record.enrichedDescription || ""}"`,
          `"${record.tags?.join("; ") || ""}"`,
          record.confidence?.toFixed(2) || "",
          record.amount || "",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `enriched-spend-data-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload & Analyze Spend Data</h1>
          <p className="text-gray-600 mt-2">
            Upload your procurement data or paste it directly to get AI-powered insights
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  Data Input
                </CardTitle>
                <CardDescription>Choose how you want to input your spend data</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="text" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="text">Paste Text</TabsTrigger>
                    <TabsTrigger value="file">Upload File</TabsTrigger>
                  </TabsList>

                  <TabsContent value="text" className="space-y-4">
                    <div>
                      <Label htmlFor="spend-data">Spend Data (one record per line)</Label>
                      <Textarea
                        id="spend-data"
                        placeholder="Appl Inc. IT Eqpt PO-4532 10K&#10;Consulting services - invoice 3239&#10;Office supplies from Staples"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        rows={8}
                        className="mt-2"
                      />
                    </div>
                    <Button onClick={handleTextSubmit} className="w-full">
                      <FileText className="mr-2 h-4 w-4" />
                      Prepare Records
                    </Button>
                  </TabsContent>

                  <TabsContent value="file" className="space-y-4">
                    <div>
                      <Label htmlFor="file-upload">Upload CSV File</Label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileUpload}
                        className="mt-2"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Supports CSV files with description, amount, and vendor columns
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {records.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Ready for Processing</CardTitle>
                  <CardDescription>{records.length} records loaded and ready for AI enrichment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {records.slice(0, 3).map((record, index) => (
                      <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                        {record.originalDescription}
                      </div>
                    ))}
                    {records.length > 3 && (
                      <div className="text-sm text-gray-500">... and {records.length - 3} more records</div>
                    )}
                  </div>

                  <Button onClick={handleEnrichment} disabled={isProcessing} className="w-full">
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing with AI...
                      </>
                    ) : (
                      "Enrich with AI"
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Section */}
          <div>
            {enrichedRecords.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Enriched Results</CardTitle>
                      <CardDescription>AI-processed and categorized spend data</CardDescription>
                    </div>
                    <Button onClick={exportToCSV} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {enrichedRecords.map((record, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">Original:</p>
                            <p className="font-mono text-sm">{record.originalDescription}</p>
                          </div>
                          <Badge variant="secondary">{Math.round((record.confidence || 0) * 100)}% confidence</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Category:</p>
                            <p className="font-medium">{record.category}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Vendor:</p>
                            <p className="font-medium">{record.normalizedVendor || "N/A"}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-gray-600 text-sm">Enriched Description:</p>
                          <p className="text-sm">{record.enrichedDescription}</p>
                        </div>

                        {record.tags && record.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {record.tags.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
