"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, File, X, FileText, FileSpreadsheet, FileImage } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  selectedFile: File | null
  disabled?: boolean
}

const getFileIcon = (filename: string) => {
  const extension = filename.split(".").pop()?.toLowerCase()

  switch (extension) {
    case "pdf":
      return <FileImage className="h-8 w-8" />
    case "csv":
      return <FileSpreadsheet className="h-8 w-8" />
    case "txt":
    case "docx":
    case "doc":
      return <FileText className="h-8 w-8" />
    default:
      return <File className="h-8 w-8" />
  }
}

export function FileUpload({ onFileSelect, onFileRemove, selectedFile, disabled }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0])
      }
      setDragActive(false)
    },
    [onFileSelect],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
      "text/csv": [".csv"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
    },
    multiple: false,
    disabled,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  })

  if (selectedFile) {
    return (
      <Card className="border-2 border-dashed border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon(selectedFile.name)}
              <div>
                <p className="font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onFileRemove} disabled={disabled} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed border-border cursor-pointer transition-all duration-200",
        "hover:border-foreground hover:bg-muted/50",
        isDragActive && "border-foreground bg-muted",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <CardContent className="p-8">
        <input {...getInputProps()} />
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {isDragActive ? "Drop your file here" : "Upload a file"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">Drag and drop your file here, or click to browse</p>
          <p className="text-xs text-muted-foreground">Supports: .txt, .csv, .pdf, .docx files (max 10MB)</p>
          <Button variant="outline" className="mt-4 bg-transparent" disabled={disabled}>
            Choose File
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
