import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { TodoItem, DailyPlan, AISettings, TaskCompletionDialog, TodoUpdateLog, AppSettings } from './types'

interface TodoStore {
  // State
  hasCompletedOnboarding: boolean
  currentPlan: DailyPlan | null
  items: TodoItem[]
  aiSettings: AISettings
  appSettings: AppSettings
  isOrganizing: boolean
  currentFocusItem: TodoItem | null
  focusStartTime: Date | null
  completionDialog: TaskCompletionDialog
  detailPanelOpen: boolean
  selectedTodo: TodoItem | null
  showSettings: boolean

  // Actions
  setHasCompletedOnboarding: (completed: boolean) => void
  setCurrentPlan: (plan: DailyPlan | null) => void
  setItems: (items: TodoItem[] | ((prev: TodoItem[]) => TodoItem[])) => void
  setAiSettings: (settings: AISettings) => void
  setAppSettings: (settings: Partial<AppSettings>) => void
  setIsOrganizing: (organizing: boolean) => void
  setCurrentFocusItem: (item: TodoItem | null) => void
  setFocusStartTime: (time: Date | null) => void
  setCompletionDialog: (dialog: TaskCompletionDialog) => void
  setDetailPanelOpen: (open: boolean) => void
  setSelectedTodo: (todo: TodoItem | null) => void
  setShowSettings: (show: boolean) => void

  // Helper actions
  addUpdateLog: (todoId: number, field: string, oldValue: string, newValue: string, updatedBy: 'ai' | 'human', context?: string) => void
  completeItem: (id: number, completed?: boolean) => void
  addItem: () => void
  deleteItem: (id: number) => void
  resetItems: () => void
  updateTodo: (todoId: number, updates: Partial<TodoItem>, updatedBy: 'human' | 'ai', context?: string) => void
  openDetailPanel: (todo: TodoItem) => void
  closeDetailPanel: () => void
  openSettings: () => void
  closeSettings: () => void
  saveDailyPlan: (plan: DailyPlan) => void
  getDailyPlans: () => DailyPlan[]
}

export const useTodoStore = create<TodoStore>()(
  persist(
    (set, get) => ({
      // Initial state
      hasCompletedOnboarding: false,
      currentPlan: null,
      items: [],
      aiSettings: {
        topP: 0.9,
        temperature: 0.5,
        maxTokens: 1000,
      },
      appSettings: {
        useOllama: false,
        ollamaBaseUrl: 'http://localhost:11434',
        selectedModel: '',
        availableModels: [],
        aiProvider: 'openai',
        theme: 'dark',
        autoSave: true,
        notifications: true,
      },
      isOrganizing: false,
      currentFocusItem: null,
      focusStartTime: null,
      completionDialog: {
        isOpen: false,
        todoId: null,
        timeSpent: 0,
        completed: false
      },
      detailPanelOpen: false,
      selectedTodo: null,
      showSettings: false,

      // Basic setters
      setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),
      setCurrentPlan: (plan) => set({ currentPlan: plan }),
      setItems: (items) => set((state) => ({ 
        items: typeof items === 'function' ? items(state.items) : items 
      })),
      setAiSettings: (settings) => set({ aiSettings: settings }),
      setAppSettings: (settings) => set((state) => ({ 
        appSettings: { ...state.appSettings, ...settings } 
      })),
      setIsOrganizing: (organizing) => set({ isOrganizing: organizing }),
      setCurrentFocusItem: (item) => set({ currentFocusItem: item }),
      setFocusStartTime: (time) => set({ focusStartTime: time }),
      setCompletionDialog: (dialog) => set({ completionDialog: dialog }),
      setDetailPanelOpen: (open) => set({ detailPanelOpen: open }),
      setSelectedTodo: (todo) => set({ selectedTodo: todo }),
      setShowSettings: (show) => set({ showSettings: show }),

      // Helper actions
      addUpdateLog: (todoId, field, oldValue, newValue, updatedBy, context) => {
        const updateLog: TodoUpdateLog = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          field,
          oldValue,
          newValue,
          updatedBy,
          context
        }

        set((state) => ({
          items: state.items.map(item => 
            item.id === todoId 
              ? { ...item, updateLog: [...(item.updateLog || []), updateLog] }
              : item
          )
        }))
      },

      completeItem: (id, completed = true) => {
        const { addUpdateLog } = get()
        
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id === id) {
              const oldStatus = item.checked ? 'completed' : 'pending'
              const newStatus = completed ? 'completed' : 'pending'
              
              // Log the status change
              if (oldStatus !== newStatus) {
                addUpdateLog(id, 'status', oldStatus, newStatus, 'human', completed ? 'Task marked as completed' : 'Task marked as incomplete')
              }
              
              return { 
                ...item, 
                checked: completed, 
                completedAt: completed ? new Date() : undefined,
                progressStatus: completed ? 'completed' : 'needs-clarification',
                isCurrentlyActive: false
              }
            }
            return item
          })
        }))
      },

      addItem: () => {
        const { items } = get()
        const newItem: TodoItem = {
          id: Date.now(),
          text: `New Task ${items.length + 1}`,
          description: "",
          checked: false,
          priority: "medium",
          complexity: "moderate",
          estimatedMinutes: 30,
          createdAt: new Date(),
          order: items.length + 1,
          focusTimeSpent: 0,
          attempts: 0,
          isCurrentlyActive: false,
          progressStatus: 'not-started',
          updateLog: []
        }
        
        set((state) => ({ items: [...state.items, newItem] }))
      },

      deleteItem: (id: number) => {
        set((state) => ({ 
          items: state.items.filter(item => item.id !== id) 
        }))
      },

      resetItems: () => {
        set({ 
          items: [],
          currentPlan: null,
          hasCompletedOnboarding: false
        })
        
        // Clear localStorage for onboarding
        const today = new Date().toDateString()
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`dailyPlan_${today}`)
          localStorage.removeItem('lastOnboardingDate')
        }
      },

      updateTodo: (todoId, updates, updatedBy, context) => {
        const { addUpdateLog, selectedTodo } = get()
        
        set((state) => ({
          items: state.items.map(item => {
            if (item.id === todoId) {
              const updatedItem = { ...item, ...updates }
              
              // Log each field that changed
              Object.keys(updates).forEach(key => {
                const field = key as keyof TodoItem
                if (field !== 'updateLog' && item[field] !== updates[field]) {
                  const oldValue = String(item[field] || '')
                  const newValue = String(updates[field] || '')
                  addUpdateLog(todoId, field, oldValue, newValue, updatedBy, context)
                }
              })
              
              return updatedItem
            }
            return item
          }),
          // Update selected todo if it's the one being edited
          selectedTodo: selectedTodo?.id === todoId ? { ...selectedTodo, ...updates } : selectedTodo
        }))
      },

      openDetailPanel: (todo) => {
        set({ 
          selectedTodo: todo,
          detailPanelOpen: true
        })
      },

      closeDetailPanel: () => {
        set({ 
          detailPanelOpen: false,
          selectedTodo: null
        })
      },

      openSettings: () => {
        set({ showSettings: true })
      },

      closeSettings: () => {
        set({ showSettings: false })
      },

      saveDailyPlan: (plan: DailyPlan) => {
        const today = plan.date.toDateString()
        const savedPlans = JSON.parse(localStorage.getItem('dailyPlans') || '{}')
        savedPlans[today] = plan
        localStorage.setItem('dailyPlans', JSON.stringify(savedPlans))
      },

      getDailyPlans: () => {
        const savedPlans = JSON.parse(localStorage.getItem('dailyPlans') || '{}')
        return Object.values(savedPlans).map((plan: any) => ({
          ...plan,
          date: new Date(plan.date),
          todos: plan.todos.map((todo: any) => ({
            ...todo,
            createdAt: new Date(todo.createdAt),
            completedAt: todo.completedAt ? new Date(todo.completedAt) : undefined,
            deadline: todo.deadline ? new Date(todo.deadline) : undefined
          }))
        })) as DailyPlan[]
      },
    }),
    {
      name: 'focus-todo-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist certain parts of the state
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        currentPlan: state.currentPlan,
        items: state.items,
        aiSettings: state.aiSettings,
        appSettings: state.appSettings,
      }),
      // Serialize dates properly
      serialize: (state) => {
        return JSON.stringify(state, (key, value) => {
          if (value instanceof Date) {
            return { __type: 'Date', value: value.toISOString() }
          }
          return value
        })
      },
      // Deserialize dates properly
      deserialize: (str) => {
        return JSON.parse(str, (key, value) => {
          if (value && typeof value === 'object' && value.__type === 'Date') {
            return new Date(value.value)
          }
          return value
        })
      },
    }
  )
)
