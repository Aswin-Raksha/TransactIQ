"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Download } from "lucide-react"
import { generatePDF, downloadFile } from "@/lib/file-generators"
import { toast } from "sonner"

interface AIResponseProps {
  content: string
  isTyping?: boolean
  title?: string
}

export function AIResponse({ content, isTyping = false, title = "AI Response" }: AIResponseProps) {
  const [displayedContent, setDisplayedContent] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (isTyping && content) {
      setDisplayedContent("")
      setCurrentIndex(0)

      const timer = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          if (prevIndex < content.length) {
            setDisplayedContent(content.slice(0, prevIndex + 1))
            return prevIndex + 1
          } else {
            clearInterval(timer)
            return prevIndex
          }
        })
      }, 20) // Adjust speed here

      return () => clearInterval(timer)
    } else {
      setDisplayedContent(content)
    }
  }, [content, isTyping])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success("Response copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy response")
    }
  }

  const handleDownloadPDF = () => {
    const pdfFile = generatePDF(content, title)
    downloadFile(pdfFile)
    toast.success("PDF downloaded successfully")
  }

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-foreground leading-relaxed">
            {displayedContent}
            {isTyping && currentIndex < content.length && (
              <span className="inline-block w-2 h-5 bg-foreground ml-1 animate-pulse" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
