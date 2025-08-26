"use client"

import { useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  ArrowLeft, 
  FileText, 
  Save, 
  Download, 
  Plus,
  X,
  FolderOpen,
  Trash2,
  Edit3,
  Eye,
  Clock,
  User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TipTapEditor } from "@/components/tiptap-editor"
import { GeneratedDocument } from "@/lib/types"
import { toast } from "sonner"

interface TipTapDocumentPageProps {
  onClose: () => void
}

export function TipTapDocumentPage({ onClose }: TipTapDocumentPageProps) {
  const [documents, setDocuments] = useState<GeneratedDocument[]>([])
  const [currentDocument, setCurrentDocument] = useState<GeneratedDocument | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newDocumentTitle, setNewDocumentTitle] = useState('')
  const [content, setContent] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list')

  // Load saved documents on mount
  useEffect(() => {
    const savedDocuments = JSON.parse(localStorage.getItem('generatedDocuments') || '[]')
    setDocuments(savedDocuments.map((doc: any) => ({
      ...doc,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt)
    })))
  }, [])

  const createNewDocument = useCallback(() => {
    if (!newDocumentTitle.trim()) {
      toast.error("Please enter a document title")
      return
    }

    const newDoc: GeneratedDocument = {
      id: Date.now().toString(),
      title: newDocumentTitle.trim(),
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      projectName: newDocumentTitle.trim(),
      status: 'draft',
      version: 1
    }

    setCurrentDocument(newDoc)
    setContent('')
    setNewDocumentTitle('')
    setIsCreating(false)
    setViewMode('editor')
    
    toast.success("New document created!", {
      description: "Start writing your document"
    })
  }, [newDocumentTitle])

  const openDocument = useCallback((doc: GeneratedDocument) => {
    setCurrentDocument(doc)
    setContent(doc.content)
    setViewMode('editor')
  }, [])

  const saveDocument = useCallback(() => {
    if (!currentDocument) return
    
    const updatedDocument = {
      ...currentDocument,
      content: content,
      updatedAt: new Date(),
      version: currentDocument.version + 1
    }
    
    // Update documents list
    const updatedDocuments = documents.map(doc => 
      doc.id === currentDocument.id ? updatedDocument : doc
    )
    
    // Save to localStorage
    localStorage.setItem('generatedDocuments', JSON.stringify(updatedDocuments))
    setDocuments(updatedDocuments)
    setCurrentDocument(updatedDocument)
    
    toast.success("Document saved!", {
      description: "Your changes have been saved"
    })
  }, [currentDocument, content, documents])

  const deleteDocument = useCallback((docId: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== docId)
    localStorage.setItem('generatedDocuments', JSON.stringify(updatedDocuments))
    setDocuments(updatedDocuments)
    
    if (currentDocument?.id === docId) {
      setCurrentDocument(null)
      setViewMode('list')
    }
    
    toast.success("Document deleted!", {
      description: "The document has been removed"
    })
  }, [documents, currentDocument])

  const downloadDocument = useCallback(() => {
    if (!currentDocument) return
    
    const element = document.createElement('a')
    const file = new Blob([content], { type: 'text/html' })
    element.href = URL.createObjectURL(file)
    element.download = `${currentDocument.title}.html`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    
    toast.success("Document downloaded!", {
      description: "Your document has been downloaded as HTML"
    })
  }, [currentDocument, content])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-500'
      case 'final': return 'bg-green-500'
      case 'archived': return 'bg-gray-500'
      default: return 'bg-blue-500'
    }
  }

  if (viewMode === 'editor' && currentDocument) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setViewMode('list')}
                variant="ghost"
                size="sm"
                className="text-neutral-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Documents
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">{currentDocument.title}</h1>
                <p className="text-neutral-400">
                  Last updated: {formatDate(currentDocument.updatedAt)} • Version {currentDocument.version}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={saveDocument}
                variant="outline"
                className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button
                onClick={downloadDocument}
                variant="outline"
                className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Editor */}
          <TipTapEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your document..."
            className="min-h-[600px]"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-neutral-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Documents</h1>
              <p className="text-neutral-400">Create and edit rich text documents</p>
            </div>
          </div>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Document
          </Button>
        </div>

        {/* Create New Document Modal */}
        {isCreating && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold mb-4">Create New Document</h3>
              <Input
                value={newDocumentTitle}
                onChange={(e) => setNewDocumentTitle(e.target.value)}
                placeholder="Enter document title..."
                className="mb-4 bg-gray-800 border-gray-700 text-white"
                onKeyPress={(e) => e.key === 'Enter' && createNewDocument()}
              />
              <div className="flex gap-2">
                <Button
                  onClick={createNewDocument}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Create
                </Button>
                <Button
                  onClick={() => setIsCreating(false)}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Documents Grid */}
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Documents Yet</h3>
            <p className="text-gray-500 mb-6">Create your first document to get started</p>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Document
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 cursor-pointer transition-all duration-300 hover:bg-gray-800/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-lg truncate">
                        {doc.title}
                      </CardTitle>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(doc.status)}`}></div>
                    </div>
                    <CardDescription className="text-gray-400">
                      Version {doc.version} • {doc.status}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>Updated {formatDate(doc.updatedAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <User className="w-4 h-4" />
                        <span>{doc.projectName}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          onClick={() => openDocument(doc)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => deleteDocument(doc.id)}
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
