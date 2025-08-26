"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Users, 
  Target, 
  DollarSign, 
  Clock, 
  Brain, 
  Save, 
  Download, 
  Plus,
  X,
  Sparkles,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { TipTapEditor } from "@/components/tiptap-editor"
import { useTodoStore } from "@/lib/store"
import { DocumentGenerationRequest, GeneratedDocument } from "@/lib/types"
import { toast } from "sonner"

interface DocumentGenerationPageProps {
  onClose: () => void
}

export function DocumentGenerationPage({ onClose }: DocumentGenerationPageProps) {
  const { appSettings } = useTodoStore()
  const [step, setStep] = useState<'form' | 'generating' | 'editor'>('form')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [currentDocument, setCurrentDocument] = useState<GeneratedDocument | null>(null)
  
  const [formData, setFormData] = useState<DocumentGenerationRequest>({
    projectName: '',
    projectDescription: '',
    timeline: '',
    deliverables: [],
    stakeholders: [],
    budget: '',
    constraints: '',
    requirements: []
  })

  const [newDeliverable, setNewDeliverable] = useState('')
  const [newStakeholder, setNewStakeholder] = useState('')
  const [newRequirement, setNewRequirement] = useState('')

  const addDeliverable = useCallback(() => {
    if (newDeliverable.trim() && !formData.deliverables.includes(newDeliverable.trim())) {
      setFormData(prev => ({
        ...prev,
        deliverables: [...prev.deliverables, newDeliverable.trim()]
      }))
      setNewDeliverable('')
    }
  }, [newDeliverable, formData.deliverables])

  const removeDeliverable = useCallback((deliverable: string) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter(d => d !== deliverable)
    }))
  }, [])

  const addStakeholder = useCallback(() => {
    if (newStakeholder.trim() && !formData.stakeholders.includes(newStakeholder.trim())) {
      setFormData(prev => ({
        ...prev,
        stakeholders: [...prev.stakeholders, newStakeholder.trim()]
      }))
      setNewStakeholder('')
    }
  }, [newStakeholder, formData.stakeholders])

  const removeStakeholder = useCallback((stakeholder: string) => {
    setFormData(prev => ({
      ...prev,
      stakeholders: prev.stakeholders.filter(s => s !== stakeholder)
    }))
  }, [])

  const addRequirement = useCallback(() => {
    if (newRequirement.trim() && !formData.requirements.includes(newRequirement.trim())) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }))
      setNewRequirement('')
    }
  }, [newRequirement, formData.requirements])

  const removeRequirement = useCallback((requirement: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter(r => r !== requirement)
    }))
  }, [])

  const generateDocument = useCallback(async () => {
    if (!formData.projectName || !formData.projectDescription || !formData.timeline) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsGenerating(true)
    setStep('generating')

    try {
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'generate-sow-document',
          projectData: formData,
          appSettings
        })
      })

      if (!response.ok) throw new Error('Failed to generate document')

      const { content } = await response.json()
      setGeneratedContent(content)
      
      const document: GeneratedDocument = {
        id: Date.now().toString(),
        title: `SOW - ${formData.projectName}`,
        content: content,
        createdAt: new Date(),
        updatedAt: new Date(),
        projectName: formData.projectName,
        status: 'draft',
        version: 1
      }
      
      setCurrentDocument(document)
      setStep('editor')
      
      toast.success("Document generated successfully!", {
        description: "You can now edit and customize the content"
      })
    } catch (error) {
      console.error('Error generating document:', error)
      toast.error("Failed to generate document", {
        description: "Please try again or check your AI settings"
      })
      setStep('form')
    } finally {
      setIsGenerating(false)
    }
  }, [formData, appSettings])

  const saveDocument = useCallback(() => {
    if (!currentDocument) return
    
    const updatedDocument = {
      ...currentDocument,
      content: generatedContent,
      updatedAt: new Date(),
      version: currentDocument.version + 1
    }
    
    // Save to localStorage
    const savedDocuments = JSON.parse(localStorage.getItem('generatedDocuments') || '[]')
    const existingIndex = savedDocuments.findIndex((doc: any) => doc.id === currentDocument.id)
    
    if (existingIndex >= 0) {
      savedDocuments[existingIndex] = updatedDocument
    } else {
      savedDocuments.push(updatedDocument)
    }
    
    localStorage.setItem('generatedDocuments', JSON.stringify(savedDocuments))
    
    toast.success("Document saved!", {
      description: "Your document has been saved locally"
    })
  }, [currentDocument, generatedContent])

  const downloadDocument = useCallback(() => {
    if (!currentDocument) return
    
    const element = document.createElement('a')
    const file = new Blob([generatedContent], { type: 'text/html' })
    element.href = URL.createObjectURL(file)
    element.download = `${currentDocument.title}.html`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    
    toast.success("Document downloaded!", {
      description: "Your document has been downloaded as HTML"
    })
  }, [currentDocument, generatedContent])

  if (step === 'generating') {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6"
            />
            <h2 className="text-2xl font-bold mb-4">Generating Your SOW Document</h2>
            <p className="text-neutral-400 mb-6">
              AI is analyzing your project details and creating a comprehensive Statement of Work...
            </p>
            <div className="flex items-center justify-center gap-2 text-blue-400">
              <Brain className="w-5 h-5" />
              <span>Processing project requirements and timeline</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'editor') {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setStep('form')}
                variant="ghost"
                size="sm"
                className="text-neutral-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Form
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">{currentDocument?.title}</h1>
                <p className="text-neutral-400">Edit and customize your generated document</p>
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
            content={generatedContent}
            onChange={setGeneratedContent}
            placeholder="Your generated document content..."
            className="min-h-[600px]"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
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
              <h1 className="text-2xl font-bold text-white">Document Generation</h1>
              <p className="text-neutral-400">Create professional SOW documents with AI assistance</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Project Details */}
          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Project Information
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Basic project details and description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name *
                  </label>
                  <Input
                    value={formData.projectName}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                    placeholder="Enter project name"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Description *
                  </label>
                  <Textarea
                    value={formData.projectDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectDescription: e.target.value }))}
                    placeholder="Describe the project scope, objectives, and key details..."
                    rows={4}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Timeline *
                  </label>
                  <Input
                    value={formData.timeline}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                    placeholder="e.g., 3 months, Q1 2024, etc."
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Budget (Optional)
                  </label>
                  <Input
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    placeholder="e.g., $50,000, TBD, etc."
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Deliverables
                </CardTitle>
                <CardDescription className="text-gray-400">
                  List all project deliverables
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newDeliverable}
                    onChange={(e) => setNewDeliverable(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addDeliverable()}
                    placeholder="Add a deliverable..."
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <Button onClick={addDeliverable} size="icon" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.deliverables.map((deliverable, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-gray-800 text-white hover:bg-gray-700"
                    >
                      {deliverable}
                      <button
                        onClick={() => removeDeliverable(deliverable)}
                        className="ml-2 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stakeholders & Requirements */}
          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Stakeholders
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Key people involved in the project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newStakeholder}
                    onChange={(e) => setNewStakeholder(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addStakeholder()}
                    placeholder="Add a stakeholder..."
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <Button onClick={addStakeholder} size="icon" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.stakeholders.map((stakeholder, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-gray-800 text-white hover:bg-gray-700"
                    >
                      {stakeholder}
                      <button
                        onClick={() => removeStakeholder(stakeholder)}
                        className="ml-2 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Requirements
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Project requirements and specifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                    placeholder="Add a requirement..."
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <Button onClick={addRequirement} size="icon" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.requirements.map((requirement, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-gray-800 text-white hover:bg-gray-700"
                    >
                      {requirement}
                      <button
                        onClick={() => removeRequirement(requirement)}
                        className="ml-2 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Constraints
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Any limitations or constraints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.constraints}
                  onChange={(e) => setFormData(prev => ({ ...prev, constraints: e.target.value }))}
                  placeholder="Describe any constraints, limitations, or special considerations..."
                  rows={3}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={generateDocument}
            disabled={!formData.projectName || !formData.projectDescription || !formData.timeline}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Generate SOW Document
          </Button>
          <p className="text-sm text-neutral-400 mt-2">
            AI will create a comprehensive Statement of Work based on your inputs
          </p>
        </div>
      </div>
    </div>
  )
}
