"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, RepeatIcon, Settings2Icon, XIcon, Brain, Clock, Target, Play, Pause, Settings, Trash2, History } from "lucide-react"
import { AnimatePresence, LayoutGroup, motion } from "framer-motion"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { DirectionAwareTabs } from "@/components/ui/direction-aware-tabs"
import { FocusTimer } from "@/components/focus-timer"
import { Reorder } from "framer-motion"
import { DailyOnboarding } from "@/components/daily-onboarding"
import { TaskCompletionDialog } from "@/components/task-completion-dialog"
import { ProgressBadge } from "@/components/progress-badge"
import { TodoDetailPanel } from "@/components/todo-detail-panel"
import { SettingsPage } from "@/components/settings-page"
import { LandingPage } from "@/components/landing-page"
import { HistoryPage } from "@/components/history-page"
import { useTodoStore } from "@/lib/store"
import type { TodoItem, OrganizeRequest, OrganizeResponse, DailyPlan, ProgressBadge as ProgressBadgeType } from "@/lib/types"

export function EnhancedFocusTodoApp() {
  // Use Zustand store
  const {
    hasCompletedOnboarding,
    currentPlan,
    items,
    aiSettings,
    appSettings,
    isOrganizing,
    currentFocusItem,
    focusStartTime,
    completionDialog,
    detailPanelOpen,
    selectedTodo,
    showSettings,
    setHasCompletedOnboarding,
    setCurrentPlan,
    setItems,
    setAppSettings,
    setIsOrganizing,
    setCurrentFocusItem,
    setFocusStartTime,
    setCompletionDialog,
    addUpdateLog,
    completeItem,
    addItem,
    deleteItem,
    resetItems,
    updateTodo,
    openDetailPanel,
    closeDetailPanel,
    openSettings,
    closeSettings,
    saveDailyPlan,
    getDailyPlans,
  } = useTodoStore()

  // State for aborting AI operations
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [showLanding, setShowLanding] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  // Check if we should show onboarding
  useEffect(() => {
    const today = new Date().toDateString()
    const lastOnboardingDate = localStorage.getItem('lastOnboardingDate')
    
    if (lastOnboardingDate !== today) {
      setHasCompletedOnboarding(false)
    } else {
      setHasCompletedOnboarding(true)
      // Load saved plan for today
      const savedPlan = localStorage.getItem(`dailyPlan_${today}`)
      if (savedPlan) {
        const plan = JSON.parse(savedPlan)
        setCurrentPlan(plan)
        setItems(plan.todos || [])
      }
    }
  }, [])

  const handleOnboardingComplete = useCallback((plan: DailyPlan) => {
    const today = new Date().toDateString()
    localStorage.setItem('lastOnboardingDate', today)
    localStorage.setItem(`dailyPlan_${today}`, JSON.stringify(plan))
    
    // Save to history
    saveDailyPlan(plan)
    
    setCurrentPlan(plan)
    setItems(plan.todos)
    setHasCompletedOnboarding(true)
    toast.success("Your daily plan is ready!", {
      description: `${plan.todos.length} tasks organized for maximum productivity`
    })
  }, [saveDailyPlan])

  const handleSkipOnboarding = useCallback(() => {
    setHasCompletedOnboarding(true)
    toast.info("Skipped onboarding", {
      description: "You can start adding tasks manually"
    })
  }, [])

  const getProgressBadge = useCallback((todo: TodoItem): ProgressBadgeType | null => {
    if (!todo.isCurrentlyActive) return null
    
    const timeSpent = todo.focusTimeSpent || 0
    const percentage = Math.min((timeSpent / todo.estimatedMinutes) * 100, 100)
    const timeRemaining = Math.max(todo.estimatedMinutes - timeSpent, 0)
    
    if (timeSpent > todo.estimatedMinutes * 1.5) {
      return { status: 'danger', timeRemaining, percentage }
    }
    if (timeSpent > todo.estimatedMinutes * 1.1) {
      return { status: 'warning', timeRemaining, percentage }
    }
    if (percentage > 80) {
      return { status: 'success', timeRemaining, percentage }
    }
    return { status: 'info', timeRemaining, percentage }
  }, [])

  // Use store methods directly
  const handleCompleteItem = useCallback((id: number, completed: boolean = true) => {
    completeItem(id, completed)
  }, [completeItem])

  const handleAddItem = useCallback(() => {
    addItem()
  }, [addItem])

  const handleResetItems = useCallback(() => {
    resetItems()
  }, [resetItems])

  const organizeWithAI = useCallback(async () => {
    if (isOrganizing || items.length === 0) return
    
    const controller = new AbortController()
    setAbortController(controller)
    setIsOrganizing(true)
    
    try {
      const availableMinutes = currentPlan ? currentPlan.availableHours * 60 : 480 // 8 hours default
      const request: OrganizeRequest = {
        todos: items,
        totalAvailableMinutes: availableMinutes,
        focusMode: 'balanced',
      }

      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'organize-todos',
          ...request,
          appSettings
        }),
        signal: controller.signal
      })

      if (!response.ok) throw new Error('Failed to organize todos')

      const result: OrganizeResponse = await response.json()
      
      // Log AI reorganization for each todo
      result.organizedTodos.forEach((todo, index) => {
        const originalTodo = items.find(item => item.id === todo.id)
        if (originalTodo && originalTodo.order !== todo.order) {
          addUpdateLog(todo.id, 'order', String(originalTodo.order), String(todo.order), 'ai', 'AI reorganization')
        }
      })
      
      setItems(result.organizedTodos)
      toast.success("Todos reorganized by AI!", {
        description: result.reasoning,
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.info("AI organization cancelled")
      } else {
        console.error('Error organizing todos:', error)
        toast.error("Failed to organize todos")
      }
    } finally {
      setIsOrganizing(false)
      setAbortController(null)
    }
  }, [items, currentPlan, isOrganizing, setIsOrganizing, setItems, addUpdateLog])

  const stopAIOrganizing = useCallback(() => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
      setIsOrganizing(false)
    }
  }, [abortController, setIsOrganizing])

  const startFocusSession = useCallback((item: TodoItem) => {
    // Mark current item as active and stop any other active items
    setItems(prev => prev.map(todo => ({
      ...todo,
      isCurrentlyActive: todo.id === item.id,
      progressStatus: todo.id === item.id ? 'in-progress' : todo.progressStatus
    })))
    
    setCurrentFocusItem(item)
    setFocusStartTime(new Date())
    toast.success(`Focus session started for: ${item.text}`)
  }, [setItems, setCurrentFocusItem, setFocusStartTime])

  const endFocusSession = useCallback(() => {
    if (!currentFocusItem || !focusStartTime) return
    
    const timeSpent = Math.round((new Date().getTime() - focusStartTime.getTime()) / 60000)
    
    // Update time spent
    setItems(prev => prev.map(todo => 
      todo.id === currentFocusItem.id 
        ? { 
            ...todo, 
            focusTimeSpent: (todo.focusTimeSpent || 0) + timeSpent,
            attempts: (todo.attempts || 0) + 1,
            isCurrentlyActive: false
          }
        : todo
    ))

    // Show completion dialog
    setCompletionDialog({
      isOpen: true,
      todoId: currentFocusItem.id,
      timeSpent,
      completed: false
    })

    setCurrentFocusItem(null)
    setFocusStartTime(null)
  }, [currentFocusItem, focusStartTime, setItems, setCompletionDialog, setCurrentFocusItem, setFocusStartTime])

  const handleTaskCompletion = useCallback((completed: boolean, notes?: string) => {
    if (completionDialog.todoId) {
      handleCompleteItem(completionDialog.todoId, completed)
      
      if (completed) {
        toast.success("Task completed! 🎉")
        // Auto-start next task if available
        const currentIndex = items.findIndex(item => item.id === completionDialog.todoId)
        const nextTask = items.find((item, index) => index > currentIndex && !item.checked)
        if (nextTask) {
          setTimeout(() => {
            toast.info(`Next up: ${nextTask.text}`, {
              action: {
                label: "Start now",
                onClick: () => startFocusSession(nextTask)
              }
            })
          }, 1000)
        }
      } else {
        toast.info("Task marked as incomplete")
      }
      
      if (notes && completionDialog.todoId) {
        // Update item with notes
        updateTodo(completionDialog.todoId, { 
          description: `${items.find(t => t.id === completionDialog.todoId)?.description || ''}\n\nNotes: ${notes}` 
        }, 'human', 'Added completion notes')
      }
    }
    
    setCompletionDialog({ isOpen: false, todoId: null, timeSpent: 0, completed: false })
  }, [completionDialog.todoId, items, handleCompleteItem, startFocusSession, updateTodo, setCompletionDialog])

  const handleOpenDetailPanel = useCallback((todo: TodoItem) => {
    openDetailPanel(todo)
  }, [openDetailPanel])

  const handleCloseDetailPanel = useCallback(() => {
    closeDetailPanel()
  }, [closeDetailPanel])

  const handleUpdateTodo = useCallback((todoId: number, updates: Partial<TodoItem>, updatedBy: 'human' | 'ai', context?: string) => {
    updateTodo(todoId, updates, updatedBy, context)
  }, [updateTodo])

  const handleDeleteItem = useCallback((id: number) => {
    deleteItem(id)
    toast.success("Task deleted")
  }, [deleteItem])

  const renderListItem = (item: TodoItem, index: number) => {
    const progress = getProgressBadge(item)
    
    return (
              <Reorder.Item
          key={item.id}
          value={item}
          className="mb-4 p-4 bg-gray-900 border border-gray-800 rounded-lg cursor-grab active:cursor-grabbing"
        >
        <div className="flex flex-col space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => handleCompleteItem(item.id)}
                  className="w-4 h-4 text-[#13EEE3] bg-neutral-800 border-neutral-600 rounded focus:ring-[#13EEE3] focus:ring-2"
                />
                <span className={cn(
                  "font-medium text-white text-sm",
                  item.checked && "line-through text-neutral-500"
                )}>
                  {item.text}
                </span>
              </div>
              
              {item.description && (
                <p className="text-neutral-400 text-sm ml-7 mb-2">{item.description}</p>
              )}
              
              <div className="ml-7 space-y-2">
                <div className="flex items-center space-x-1 text-xs">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    item.priority === 'urgent' ? 'bg-red-500' :
                    item.priority === 'high' ? 'bg-orange-500' :
                    item.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  )} />
                  <span className="text-neutral-500">{item.priority}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-neutral-500" />
                      <span className="text-neutral-500">{item.estimatedMinutes}m</span>
                    </div>
                    {item.focusTimeSpent && item.focusTimeSpent > 0 && (
                      <div className="flex items-center space-x-1">
                        <Target className="w-3 h-3 text-[#13EEE3]" />
                        <span className="text-[#13EEE3]">{item.focusTimeSpent}m spent</span>
                      </div>
                    )}
                  </div>
                  {progress && <ProgressBadge progress={progress} />}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => handleDeleteItem(item.id)}
                size="sm"
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
              <Button
                onClick={() => handleOpenDetailPanel(item)}
                size="sm"
                variant="ghost"
                className="text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <Settings className="w-3 h-3" />
              </Button>
              
              {!item.checked && (
                <Button
                  onClick={() => startFocusSession(item)}
                  disabled={!!currentFocusItem}
                  size="sm"
                  className={cn(
                    "bg-green-600 hover:bg-green-700 text-white",
                    item.isCurrentlyActive && "bg-orange-500 hover:bg-orange-600 text-white"
                  )}
                >
                  {item.isCurrentlyActive ? (
                    <>
                      <Pause className="w-3 h-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 mr-1" />
                      Focus
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Reorder.Item>
    )
  }

  // Show landing page
  if (showLanding) {
    return (
      <LandingPage onGetStarted={() => setShowLanding(false)} />
    )
  }

  // Show history page
  if (showHistory) {
    return (
      <HistoryPage
        onClose={() => setShowHistory(false)}
        getDailyPlans={getDailyPlans}
      />
    )
  }

  // Show settings page
  if (showSettings) {
    return (
      <SettingsPage
        settings={appSettings}
        onSettingsChange={setAppSettings}
        onClose={closeSettings}
      />
    )
  }

  if (!hasCompletedOnboarding) {
    return (
      <DailyOnboarding 
        onComplete={handleOnboardingComplete}
        onSkip={handleSkipOnboarding}
      />
    )
  }

  // No need for todoItems mapping anymore since we're using direct Reorder

  const completedCount = items.filter(item => item.checked).length
  const totalCount = items.length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Focus Todo AI</h1>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowHistory(true)}
                variant="ghost"
                size="sm"
                className="text-neutral-400 hover:text-white"
              >
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
              <Button
                onClick={openSettings}
                variant="ghost"
                size="sm"
                className="text-neutral-400 hover:text-white"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                onClick={handleResetItems}
                variant="ghost"
                size="sm"
                className="text-neutral-400 hover:text-white"
              >
                <RepeatIcon className="w-4 h-4 mr-2" />
                New Day
              </Button>
            </div>
          </div>
          
          {currentPlan && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Today's Plan</h2>
                <div className="text-sm text-neutral-400">
                  {currentPlan.startTime} - {currentPlan.endTime}
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-neutral-400 mb-3">
                <span>{totalCount} tasks</span>
                <span>•</span>
                <span>{Math.round(progressPercentage)}% complete</span>
                <span>•</span>
                <span>{currentPlan.availableHours}h available</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  className="bg-[#13EEE3] h-2 rounded-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Focus Timer */}
        {currentFocusItem && (
          <div className="mb-8">
            <div className="bg-black border border-gray-800 rounded-xl p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold mb-2">Focus Session</h3>
                <p className="text-neutral-400">{currentFocusItem.text}</p>
              </div>
              <FocusTimer
                initialMinutes={currentFocusItem.estimatedMinutes}
                onComplete={endFocusSession}
                className="mb-4"
              />
              <div className="text-center">
                <Button
                  onClick={endFocusSession}
                  variant="outline"
                  className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white"
                >
                  End Session
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleAddItem}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
            
            {isOrganizing ? (
              <Button
                onClick={stopAIOrganizing}
                variant="outline"
                className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
              >
                <X className="w-4 h-4 mr-2" />
                Stop Organizing
              </Button>
            ) : (
              <Button
                onClick={organizeWithAI}
                disabled={items.length === 0}
                variant="outline"
                className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
              >
                <Brain className="w-4 h-4 mr-2" />
                AI Organize
              </Button>
            )}
          </div>
        </div>

        {/* Todo List */}
        <div className="bg-black border border-gray-800 rounded-xl">
          {items.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-neutral-500 mb-4">
                <Target className="w-12 h-12 mx-auto mb-4" />
                <p>No tasks yet. Add your first task to get started!</p>
              </div>
              <Button
                onClick={handleAddItem}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
          ) : (
            <Reorder.Group
              axis="y"
              values={items}
              onReorder={(reorderedItems) => {
                const reorderedTodos = reorderedItems.map((item, index) => ({
                  ...item,
                  order: index + 1
                }))
                setItems(reorderedTodos)
              }}
              className="space-y-0"
            >
              {items.map((item, index) => renderListItem(item, index))}
            </Reorder.Group>
          )}
        </div>

        {/* Task Completion Dialog */}
        <TaskCompletionDialog
          isOpen={completionDialog.isOpen}
          todo={items.find(item => item.id === completionDialog.todoId) || null}
          timeSpent={completionDialog.timeSpent}
          onComplete={handleTaskCompletion}
          onClose={() => setCompletionDialog({ isOpen: false, todoId: null, timeSpent: 0, completed: false })}
        />

        {/* Todo Detail Panel */}
        {selectedTodo && (
          <TodoDetailPanel
            todo={selectedTodo}
            isOpen={detailPanelOpen}
            onClose={handleCloseDetailPanel}
            onUpdate={(updates, updatedBy, context) => handleUpdateTodo(selectedTodo.id, updates, updatedBy, context)}
          />
        )}
      </div>
    </div>
  )
}
