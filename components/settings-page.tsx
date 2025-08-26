"use client"

import { useState, useCallback, useEffect } from "react"
import { Eye, EyeOff, RefreshCw, Check, X, Settings, ArrowLeft, Download, Cpu, Globe, Key, Bell, Palette, Save } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AppSettings, OllamaModel, ModelValidationResult } from "@/lib/types"

interface SettingsPageProps {
  settings: AppSettings
  onSettingsChange: (settings: Partial<AppSettings>) => void
  onClose: () => void
}

export function SettingsPage({ settings, onSettingsChange, onClose }: SettingsPageProps) {
  const [showApiKey, setShowApiKey] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [tempApiKey, setTempApiKey] = useState(settings.openaiApiKey || "")
  const [tempOllamaUrl, setTempOllamaUrl] = useState(settings.ollamaBaseUrl)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSaveSettings = useCallback(() => {
    onSettingsChange({
      openaiApiKey: tempApiKey,
      ollamaBaseUrl: tempOllamaUrl,
    })
    toast.success("Settings saved successfully!")
  }, [tempApiKey, tempOllamaUrl, onSettingsChange])

  const testOpenAIConnection = useCallback(async () => {
    if (!tempApiKey) {
      toast.error("Please enter an OpenAI API key")
      return
    }

    setIsTestingConnection(true)
    setConnectionStatus('idle')

    try {
      const response = await fetch('/api/test-openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: tempApiKey })
      })

      if (response.ok) {
        setConnectionStatus('success')
        toast.success("OpenAI API key is valid!")
      } else {
        setConnectionStatus('error')
        toast.error("Invalid OpenAI API key")
      }
    } catch (error) {
      setConnectionStatus('error')
      toast.error("Failed to test OpenAI connection")
    } finally {
      setIsTestingConnection(false)
    }
  }, [tempApiKey])

  const testOllamaConnection = useCallback(async () => {
    setIsTestingConnection(true)
    setConnectionStatus('idle')

    try {
      const response = await fetch('/api/test-ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: tempOllamaUrl })
      })

      const result: ModelValidationResult = await response.json()

      if (result.isValid && result.models) {
        setConnectionStatus('success')
        onSettingsChange({ 
          availableModels: result.models,
          selectedModel: result.models[0]?.name || ''
        })
        toast.success(`Ollama connected! Found ${result.models.length} models`)
      } else {
        setConnectionStatus('error')
        toast.error(result.error || "Failed to connect to Ollama")
      }
    } catch (error) {
      setConnectionStatus('error')
      toast.error("Failed to test Ollama connection")
    } finally {
      setIsTestingConnection(false)
    }
  }, [tempOllamaUrl, onSettingsChange])

  const refreshOllamaModels = useCallback(async () => {
    setIsLoadingModels(true)

    try {
      const response = await fetch('/api/ollama-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: settings.ollamaBaseUrl })
      })

      const result: ModelValidationResult = await response.json()

      if (result.isValid && result.models) {
        onSettingsChange({ availableModels: result.models })
        toast.success(`Refreshed! Found ${result.models.length} models`)
      } else {
        toast.error(result.error || "Failed to refresh models")
      }
    } catch (error) {
      toast.error("Failed to refresh Ollama models")
    } finally {
      setIsLoadingModels(false)
    }
  }, [settings.ollamaBaseUrl, onSettingsChange])

  const formatModelSize = useCallback((bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(1)} GB`
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
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
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Settings
            </h1>
            <p className="text-neutral-400">Configure your Focus Todo AI experience</p>
          </div>
        </div>

        <Tabs defaultValue="ai" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-neutral-900">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              AI Provider
            </TabsTrigger>
            <TabsTrigger value="openai" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              OpenAI
            </TabsTrigger>
            <TabsTrigger value="ollama" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Ollama
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              General
            </TabsTrigger>
          </TabsList>

          {/* AI Provider Selection */}
          <TabsContent value="ai" className="space-y-6">
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  AI Provider Selection
                </CardTitle>
                <CardDescription>
                  Choose between OpenAI's cloud models or local Ollama models
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className={cn(
                      "cursor-pointer transition-all border-2",
                      settings.aiProvider === 'openai' 
                        ? "border-blue-500 bg-blue-500/10" 
                        : "border-neutral-700 hover:border-neutral-600"
                    )}
                    onClick={() => onSettingsChange({ aiProvider: 'openai' })}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Globe className="w-6 h-6 text-blue-400" />
                        <div>
                          <h3 className="font-semibold text-white">OpenAI</h3>
                          <p className="text-sm text-neutral-400">Cloud-based GPT models</p>
                        </div>
                        {settings.aiProvider === 'openai' && (
                          <Check className="w-5 h-5 text-blue-400 ml-auto" />
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className={cn(
                      "cursor-pointer transition-all border-2",
                      settings.aiProvider === 'ollama' 
                        ? "border-green-500 bg-green-500/10" 
                        : "border-neutral-700 hover:border-neutral-600"
                    )}
                    onClick={() => onSettingsChange({ aiProvider: 'ollama' })}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Download className="w-6 h-6 text-green-400" />
                        <div>
                          <h3 className="font-semibold text-white">Ollama</h3>
                          <p className="text-sm text-neutral-400">Local open-source models</p>
                        </div>
                        {settings.aiProvider === 'ollama' && (
                          <Check className="w-5 h-5 text-green-400 ml-auto" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {settings.aiProvider === 'openai' && !settings.openaiApiKey && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-yellow-400 text-sm">
                      ⚠️ OpenAI API key required. Configure it in the OpenAI tab.
                    </p>
                  </div>
                )}

                {settings.aiProvider === 'ollama' && settings.availableModels.length === 0 && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-blue-400 text-sm">
                      ℹ️ No Ollama models found. Configure Ollama in the Ollama tab.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* OpenAI Configuration */}
          <TabsContent value="openai" className="space-y-6">
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  OpenAI Configuration
                </CardTitle>
                <CardDescription>
                  Configure your OpenAI API key for cloud-based AI models
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openai-key" className="text-white">API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="openai-key"
                        type={showApiKey ? "text" : "password"}
                        value={tempApiKey}
                        onChange={(e) => setTempApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="bg-neutral-800 border-neutral-700 text-white pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-neutral-400 hover:text-white"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button
                      onClick={testOpenAIConnection}
                      disabled={isTestingConnection || !tempApiKey}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isTestingConnection ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        "Test"
                      )}
                    </Button>
                  </div>
                  {connectionStatus === 'success' && (
                    <p className="text-green-400 text-sm flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      API key is valid
                    </p>
                  )}
                  {connectionStatus === 'error' && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <X className="w-4 h-4" />
                      Invalid API key
                    </p>
                  )}
                  <p className="text-neutral-400 text-sm">
                    Get your API key from{" "}
                    <a 
                      href="https://platform.openai.com/api-keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      OpenAI Platform
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ollama Configuration */}
          <TabsContent value="ollama" className="space-y-6">
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Ollama Configuration
                </CardTitle>
                <CardDescription>
                  Configure local Ollama server and manage models
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="ollama-url" className="text-white">Ollama Base URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="ollama-url"
                      value={tempOllamaUrl}
                      onChange={(e) => setTempOllamaUrl(e.target.value)}
                      placeholder="http://localhost:11434"
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                    <Button
                      onClick={testOllamaConnection}
                      disabled={isTestingConnection}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isTestingConnection ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        "Test"
                      )}
                    </Button>
                  </div>
                  {connectionStatus === 'success' && (
                    <p className="text-green-400 text-sm flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Ollama server connected
                    </p>
                  )}
                  {connectionStatus === 'error' && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <X className="w-4 h-4" />
                      Cannot connect to Ollama
                    </p>
                  )}
                </div>

                <Separator className="bg-neutral-700" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Available Models</h3>
                    <Button
                      onClick={refreshOllamaModels}
                      disabled={isLoadingModels}
                      variant="outline"
                      size="sm"
                      className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                    >
                      {isLoadingModels ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Refresh
                    </Button>
                  </div>

                  {settings.availableModels.length > 0 ? (
                    <div className="space-y-3">
                      <Select
                        value={settings.selectedModel}
                        onValueChange={(value) => onSettingsChange({ selectedModel: value })}
                      >
                        <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-700">
                          {settings.availableModels.map((model) => (
                            <SelectItem key={model.name} value={model.name} className="text-white">
                              <div className="flex items-center justify-between w-full">
                                <span>{model.name}</span>
                                <Badge variant="secondary" className="ml-2">
                                  {formatModelSize(model.size)}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="grid gap-2 max-h-60 overflow-y-auto">
                        {settings.availableModels.map((model) => (
                          <Card 
                            key={model.name}
                            className={cn(
                              "bg-neutral-800 border-neutral-700",
                              settings.selectedModel === model.name && "border-blue-500"
                            )}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-white">{model.name}</h4>
                                  <p className="text-sm text-neutral-400">
                                    {model.details.family} • {model.details.parameter_size}
                                  </p>
                                </div>
                                <Badge variant="secondary">
                                  {formatModelSize(model.size)}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-400">
                      <Download className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No Ollama models found</p>
                      <p className="text-sm">Install Ollama and pull some models to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Configure app behavior and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-white">Auto-save</Label>
                    <p className="text-sm text-neutral-400">
                      Automatically save your progress
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoSave}
                    onCheckedChange={(checked) => onSettingsChange({ autoSave: checked })}
                  />
                </div>

                <Separator className="bg-neutral-700" />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-white">Notifications</Label>
                    <p className="text-sm text-neutral-400">
                      Enable toast notifications for important events
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => onSettingsChange({ notifications: checked })}
                  />
                </div>

                <Separator className="bg-neutral-700" />

                <div className="space-y-2">
                  <Label className="text-white">Theme</Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(value: 'light' | 'dark' | 'system') => onSettingsChange({ theme: value })}
                  >
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      <SelectItem value="light" className="text-white">Light</SelectItem>
                      <SelectItem value="dark" className="text-white">Dark</SelectItem>
                      <SelectItem value="system" className="text-white">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end mt-8">
          <Button
            onClick={handleSaveSettings}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
