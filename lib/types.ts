export interface TodoUpdateLog {
  id: string
  timestamp: Date
  field: string
  oldValue: string
  newValue: string
  updatedBy: 'ai' | 'human'
  context?: string
}

export interface TodoItem {
  id: number
  text: string
  description: string
  checked: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  complexity: 'simple' | 'moderate' | 'complex'
  estimatedMinutes: number
  deadline?: Date
  createdAt: Date
  completedAt?: Date
  tags?: string[]
  order: number
  focusTimeSpent?: number
  attempts?: number
  isCurrentlyActive?: boolean
  progressStatus?: 'not-started' | 'in-progress' | 'completed' | 'needs-clarification'
  updateLog?: TodoUpdateLog[]
}

export interface FocusSession {
  id: string
  todoId: number
  startTime: Date
  endTime?: Date
  duration: number // in minutes
  completed: boolean
  type: 'work' | 'break'
}

export interface AISettings {
  topP: number
  temperature: number
  maxTokens: number
}

export interface TimeAllocation {
  todoId: number
  allocatedMinutes: number
  suggestedOrder: number
  reasoning: string
}

export interface OrganizeRequest {
  todos: TodoItem[]
  totalAvailableMinutes: number
  focusMode: 'balanced' | 'urgent' | 'deadline' | 'complexity'
}

export interface OrganizeResponse {
  organizedTodos: TodoItem[]
  timeAllocations: TimeAllocation[]
  reasoning: string
  totalTimeNeeded: number
}

// New types for enhanced functionality
export interface DailyPlan {
  id: string
  date: Date
  userInput: string
  availableHours: number
  startTime: string
  endTime: string
  priorities: string[]
  todos: TodoItem[]
  aiQuestions?: AIQuestion[]
  isFinalized: boolean
}

export interface AIQuestion {
  id: string
  question: string
  context: string
  answered: boolean
  answer?: string
  followUp?: boolean
}

export interface OnboardingData {
  dailyDescription: string
  availableTime: number
  startTime: string
  endTime: string
  priorities: string[]
  currentDate: Date
}

export interface TaskCompletionDialog {
  isOpen: boolean
  todoId: number | null
  timeSpent: number
  completed: boolean
  notes?: string
}

export interface ProgressBadge {
  status: 'danger' | 'warning' | 'success' | 'info'
  timeRemaining: number
  percentage: number
}

export interface AppSettings {
  openaiApiKey?: string
  useOllama: boolean
  ollamaBaseUrl: string
  selectedModel: string
  availableModels: OllamaModel[]
  aiProvider: 'openai' | 'ollama'
  theme: 'light' | 'dark' | 'system'
  autoSave: boolean
  notifications: boolean
}

export interface OllamaModel {
  name: string
  model: string
  size: number
  digest: string
  details: {
    format: string
    family: string
    families: string[]
    parameter_size: string
    quantization_level: string
  }
  expires_at: string
  size_vram: number
}

export interface OllamaResponse {
  models: OllamaModel[]
}

export interface ModelValidationResult {
  isValid: boolean
  error?: string
  models?: OllamaModel[]
}

