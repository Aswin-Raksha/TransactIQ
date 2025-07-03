"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Paperclip, Send, X, FileText } from "lucide-react"
import { toast } from "sonner"

interface SimpleAIPromptProps {
  onSubmit: (message: string, model: string, file?: File) => void
  disabled?: boolean
}

const AI_MODELS = [
  { id: "gpt-3.5-turbo", name: "GPT-3.5-turbo", icon: "🤖" },
  { id: "gpt-4", name: "GPT-4-1", icon: "🧠" },
  { id: "claude-3.5-sonnet", name: "Claude 3.5 Sonnet", icon: "🎭" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", icon: "⚡" },
]

export default function SimpleAIPrompt({ onSubmit, disabled = false }: SimpleAIPromptProps) {
  const [message, setMessage] = useState("")
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim() && !selectedFile) {
      toast.error("Please enter a message or select a file")
      return
    }

    onSubmit(message.trim() || "Analyze this file", selectedModel.id, selectedFile || undefined)
    setMessage("")
    setSelectedFile(null)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB")
        return
      }

      // Check file type
      const allowedTypes = [
        "text/plain",
        "text/csv",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/json",
      ]

      if (!allowedTypes.includes(file.type)) {
        toast.error("Supported file types: TXT, CSV, PDF, DOC, DOCX, JSON")
        return
      }

      setSelectedFile(file)
      toast.success(`File selected: ${file.name}`)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gray-100 rounded-2xl p-4 border border-gray-200">
        {/* File Preview */}
        {selectedFile && (
          <div className="mb-3 flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{selectedFile.name}</span>
              <span className="text-xs text-gray-500">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            </div>
            <Button variant="ghost" size="sm" onClick={removeFile} className="h-6 w-6 p-0 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-0">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What can I do for you?"
            className="min-h-[60px] resize-none border-0 bg-transparent text-gray-800 placeholder-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-base p-0"
            disabled={disabled}
          />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              {/* Model Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 text-gray-700 hover:bg-gray-200 h-8 px-3 rounded-lg"
                    disabled={disabled}
                  >
                    <span className="text-lg">{selectedModel.icon}</span>
                    <span className="font-medium">{selectedModel.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {AI_MODELS.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => setSelectedModel(model)}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <span className="text-lg">{model.icon}</span>
                      <span>{model.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* File Upload */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 w-8 p-0 hover:bg-gray-200 rounded-lg"
                disabled={disabled}
              >
                <Paperclip className="h-4 w-4 text-gray-600" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".txt,.csv,.pdf,.doc,.docx,.json"
              />
            </div>

            {/* Send Button - Fixed to remove yellow */}
            <Button
              type="submit"
              size="sm"
              disabled={disabled || (!message.trim() && !selectedFile)}
              className="h-8 w-8 p-0 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:bg-gray-300 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
