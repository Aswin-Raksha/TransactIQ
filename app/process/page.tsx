"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfessionalNavigation } from "@/components/professional-navigation"
import { FileUpload } from "@/components/file-upload"
import { AIResponse } from "@/components/ai-response"
import { useAuth } from "@/lib/auth-context"
import { generatePDF, generateCSV, downloadFile } from "@/lib/file-generators"
import { toast } from "sonner"
import { Loader2, Send, FileText, Upload, Download, Brain, MessageSquare, File } from "lucide-react"

export default function ProcessPage() {
  const [textInput, setTextInput] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [textResponse, setTextResponse] = useState("")
  const [fileResponse, setFileResponse] = useState<any>(null)
  const [isProcessingText, setIsProcessingText] = useState(false)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  if (!authLoading && !user) {
    router.push("/login")
    return null
  }

  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      toast.error("Please enter some text to process")
      return
    }

    setIsProcessingText(true)
    setTextResponse("")
    setIsTyping(true)

    try {
      const response = await fetch("/api/process-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: textInput }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to process text")
      }

      const data = await response.json()
      setTextResponse(data.response)
      toast.success("Text processed successfully")
    } catch (error) {
      toast.error("Failed to process text")
      setIsTyping(false)
    } finally {
      setIsProcessingText(false)
      setTimeout(() => setIsTyping(false), 1000)
    }
  }

  const handleFileSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to process")
      return
    }

    setIsProcessingFile(true)
    setFileResponse(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/process-file", {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to process file")
      }

      const data = await response.json()
      setFileResponse(data)
      toast.success("File processed successfully")
    } catch (error) {
      toast.error("Failed to process file")
      console.error("File processing error:", error)
    } finally {
      setIsProcessingFile(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!fileResponse) return

    const pdfFile = generatePDF(fileResponse.analysis, `Analysis of ${fileResponse.filename}`)
    downloadFile(pdfFile)
    toast.success("Analysis downloaded successfully")
  }

  const handleDownloadCSV = () => {
    if (!fileResponse) return

    const csvData = [
      { field: "Filename", value: fileResponse.filename },
      { field: "File Type", value: fileResponse.type },
      { field: "Processed At", value: fileResponse.processedAt },
      { field: "Analysis", value: fileResponse.analysis },
      { field: "Summary", value: fileResponse.summary || "N/A" },
    ]

    const csvFile = generateCSV(csvData, `analysis-${fileResponse.filename}.csv`)
    downloadFile(csvFile)
    toast.success("CSV downloaded successfully")
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-foreground" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ProfessionalNavigation />

      <main className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Brain className="h-12 w-12 text-foreground" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">AI Content Processor</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Process text input or upload files for AI analysis. Get instant responses or downloadable results.
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="text" className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Text Input
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center">
              <File className="h-4 w-4 mr-2" />
              File Upload
            </TabsTrigger>
          </TabsList>

          {/* Text Input Tab */}
          <TabsContent value="text" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Text Input
                  </CardTitle>
                  <CardDescription>Enter your text below and get an AI-generated response instantly</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="text-input">Your Text</Label>
                    <Textarea
                      id="text-input"
                      placeholder="Enter your text here for AI analysis..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      rows={8}
                      className="mt-2 resize-none"
                      disabled={isProcessingText}
                    />
                  </div>
                  <Button
                    onClick={handleTextSubmit}
                    disabled={isProcessingText || !textInput.trim()}
                    className="w-full"
                  >
                    {isProcessingText ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Process Text
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Response Section */}
              <div>
                {textResponse && <AIResponse content={textResponse} isTyping={isTyping} title="AI Analysis" />}
                {!textResponse && !isProcessingText && (
                  <Card className="h-full border-dashed border-2 border-border">
                    <CardContent className="flex items-center justify-center h-full min-h-[300px]">
                      <div className="text-center text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>AI response will appear here</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* File Upload Tab */}
          <TabsContent value="file" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="mr-2 h-5 w-5" />
                    File Upload
                  </CardTitle>
                  <CardDescription>Upload a file for AI analysis and get downloadable results</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FileUpload
                    onFileSelect={setSelectedFile}
                    onFileRemove={() => setSelectedFile(null)}
                    selectedFile={selectedFile}
                    disabled={isProcessingFile}
                  />
                  <Button onClick={handleFileSubmit} disabled={isProcessingFile || !selectedFile} className="w-full">
                    {isProcessingFile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing File...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Analyze File
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Results Section */}
              <div>
                {fileResponse && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Analysis Results</CardTitle>
                      <CardDescription>
                        File: {fileResponse.filename} • Type: {fileResponse.type}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-foreground leading-relaxed max-h-64 overflow-y-auto custom-scrollbar">
                          {fileResponse.analysis}
                        </div>
                      </div>
                      <div className="flex space-x-2 pt-4 border-t">
                        <Button onClick={handleDownloadPDF} variant="outline" className="flex-1 bg-transparent">
                          <Download className="h-4 w-4 mr-2" />
                          Download Analysis
                        </Button>
                        <Button onClick={handleDownloadCSV} variant="outline" className="flex-1 bg-transparent">
                          <Download className="h-4 w-4 mr-2" />
                          Download CSV
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {!fileResponse && !isProcessingFile && (
                  <Card className="h-full border-dashed border-2 border-border">
                    <CardContent className="flex items-center justify-center h-full min-h-[300px]">
                      <div className="text-center text-muted-foreground">
                        <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Analysis results will appear here</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Text Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Get instant AI responses to your text input with real-time typing animation, just like ChatGPT.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">File Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Upload documents, spreadsheets, or text files for comprehensive AI analysis with downloadable results.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Options</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Download your analysis results as formatted text files or CSV data files for further processing.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
