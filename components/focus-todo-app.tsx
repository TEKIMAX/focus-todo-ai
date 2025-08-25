"use client"

import { useCallback, useState } from "react"
import { Plus, RepeatIcon, Settings2Icon, XIcon, Brain, Clock, Target } from "lucide-react"
import { AnimatePresence, LayoutGroup, motion } from "framer-motion"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { DirectionAwareTabs } from "@/components/ui/direction-aware-tabs"
import { FocusTimer } from "@/components/focus-timer"
import { SortableList, SortableListItem, Item } from "@/components/ui/sortable-list"
import type { TodoItem, OrganizeRequest, OrganizeResponse, AISettings } from "@/lib/types"

const initialTodos: TodoItem[] = [
  {
    id: 1,
    text: "Review project requirements",
    description: "Go through the client brief and understand all requirements for the new web application project",
    checked: false,
    priority: "high",
    complexity: "moderate",
    estimatedMinutes: 30,
    createdAt: new Date(),
    order: 1,
  },
  {
    id: 2,
    text: "Design system research",
    description: "Research and analyze modern design systems to establish component library standards",
    checked: false,
    priority: "medium",
    complexity: "complex",
    estimatedMinutes: 45,
    createdAt: new Date(),
    order: 2,
  },
  {
    id: 3,
    text: "Team standup meeting",
    description: "Daily standup with development team to discuss progress and blockers",
    checked: false,
    priority: "urgent",
    complexity: "simple",
    estimatedMinutes: 15,
    createdAt: new Date(),
    order: 3,
  },
]

export function FocusTodoApp() {
  const [items, setItems] = useState<TodoItem[]>(initialTodos)
  const [openItemId, setOpenItemId] = useState<number | null>(null)
  const [tabChangeRerender, setTabChangeRerender] = useState<number>(1)
  const [aiSettings, setAiSettings] = useState<AISettings>({
    topP: 0.9,
    temperature: 0.7,
    maxTokens: 1000,
  })
  const [isOrganizing, setIsOrganizing] = useState(false)
  const [totalTimeAvailable, setTotalTimeAvailable] = useState(120) // 2 hours default
  const [focusMode, setFocusMode] = useState<'balanced' | 'urgent' | 'deadline' | 'complexity'>('balanced')
  const [currentFocusItem, setCurrentFocusItem] = useState<TodoItem | null>(null)

  const handleCompleteItem = useCallback((id: number) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id 
          ? { ...item, checked: !item.checked, completedAt: !item.checked ? new Date() : undefined }
          : item
      )
    )
  }, [])

  const handleAddItem = useCallback(() => {
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
    }
    setItems((prevItems) => [...prevItems, newItem])
  }, [items.length])

  const handleResetItems = useCallback(() => {
    setItems(initialTodos)
  }, [])

  const handleCloseOnDrag = useCallback(() => {
    setOpenItemId(null)
  }, [])

  const organizeWithAI = useCallback(async () => {
    if (isOrganizing) return
    
    setIsOrganizing(true)
    try {
      const request: OrganizeRequest = {
        todos: items,
        totalAvailableMinutes: totalTimeAvailable,
        focusMode,
      }

      const response = await fetch('/api/organize-todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) throw new Error('Failed to organize todos')

      const result: OrganizeResponse = await response.json()
      
      setItems(result.organizedTodos)
      toast.success("Todos organized by AI!", {
        description: result.reasoning,
      })
    } catch (error) {
      console.error('Error organizing todos:', error)
      toast.error("Failed to organize todos")
    } finally {
      setIsOrganizing(false)
    }
  }, [items, totalTimeAvailable, focusMode, isOrganizing])

  const startFocusSession = useCallback((item: TodoItem) => {
    setCurrentFocusItem(item)
  }, [])

  const endFocusSession = useCallback(() => {
    if (currentFocusItem) {
      handleCompleteItem(currentFocusItem.id)
      setCurrentFocusItem(null)
      toast.success("Focus session completed!")
    }
  }, [currentFocusItem, handleCompleteItem])

  const renderListItem = (
    item: TodoItem,
    order: number,
    onCompleteItem: (id: number) => void,
    onRemoveItem: (id: number) => void
  ) => {
    const isOpen = item.id === openItemId

    const tabs = [
      {
        id: 0,
        label: "Details",
        content: (
          <div className="flex w-full flex-col pr-2 py-2 space-y-4">
            <motion.div
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.75, delay: 0.15 }}
            >
              <label className="text-xs text-neutral-400">Task Title</label>
              <input
                type="text"
                value={item.text}
                className="w-full rounded-lg border font-semibold border-black/10 bg-neutral-800 px-3 py-2 text-lg text-white placeholder:text-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13EEE3]/80"
                onChange={(e) => {
                  const text = e.target.value
                  setItems((prevItems) =>
                    prevItems.map((i) => i.id === item.id ? { ...i, text } : i)
                  )
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.75, delay: 0.2 }}
            >
              <label className="text-xs text-neutral-400">Description</label>
              <textarea
                className="h-20 w-full resize-none rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13EEE3]/80"
                value={item.description}
                placeholder="Describe your task..."
                onChange={(e) => {
                  const description = e.target.value
                  setItems((prevItems) =>
                    prevItems.map((i) => i.id === item.id ? { ...i, description } : i)
                  )
                }}
              />
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-400">Priority</label>
                <select
                  value={item.priority}
                  onChange={(e) => {
                    const priority = e.target.value as TodoItem['priority']
                    setItems((prevItems) =>
                      prevItems.map((i) => i.id === item.id ? { ...i, priority } : i)
                    )
                  }}
                  className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13EEE3]/80"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-400">Complexity</label>
                <select
                  value={item.complexity}
                  onChange={(e) => {
                    const complexity = e.target.value as TodoItem['complexity']
                    setItems((prevItems) =>
                      prevItems.map((i) => i.id === item.id ? { ...i, complexity } : i)
                    )
                  }}
                  className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13EEE3]/80"
                >
                  <option value="simple">Simple</option>
                  <option value="moderate">Moderate</option>
                  <option value="complex">Complex</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-neutral-400">Estimated Time (minutes)</label>
              <input
                type="number"
                value={item.estimatedMinutes}
                onChange={(e) => {
                  const estimatedMinutes = parseInt(e.target.value) || 0
                  setItems((prevItems) =>
                    prevItems.map((i) => i.id === item.id ? { ...i, estimatedMinutes } : i)
                  )
                }}
                className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13EEE3]/80"
                min="5"
                step="5"
              />
            </div>
          </div>
        ),
      },
      {
        id: 1,
        label: "Focus",
        content: (
          <div className="flex flex-col items-center py-4">
            <FocusTimer
              initialMinutes={Math.max(5, Math.min(60, item.estimatedMinutes))}
              onComplete={endFocusSession}
              className="mb-4"
            />
            <Button
              onClick={() => startFocusSession(item)}
              className="bg-[#13EEE3] hover:bg-[#13EEE3]/90 text-black font-medium"
            >
              Start Focus Session
            </Button>
          </div>
        ),
      },
    ]

    return (
      <SortableListItem
        item={item}
        order={order}
        key={item.id}
        isExpanded={isOpen}
        onCompleteItem={onCompleteItem}
        onRemoveItem={onRemoveItem}
        handleDrag={handleCloseOnDrag}
        className="my-2"
        renderExtra={(item) => (
          <div
            key={`${isOpen}`}
            className={cn(
              "flex h-full w-full flex-col items-center justify-center gap-2",
              isOpen ? "py-1 px-1" : "py-3"
            )}
          >
            <motion.button
              layout
              onClick={() => setOpenItemId(!isOpen ? item.id : null)}
              key="collapse"
              className={cn(
                isOpen
                  ? "absolute right-3 top-3 z-10"
                  : "relative z-10 ml-auto mr-3"
              )}
            >
              {isOpen ? (
                <motion.span
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 1, filter: "blur(0px)" }}
                  transition={{ type: "spring", duration: 1.95 }}
                >
                  <XIcon className="h-5 w-5 text-neutral-500" />
                </motion.span>
              ) : (
                <motion.span
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 1, filter: "blur(0px)" }}
                  transition={{ type: "spring", duration: 0.95 }}
                >
                  <Settings2Icon className="stroke-1 h-5 w-5 text-white/80 hover:stroke-[#13EEE3]/70" />
                </motion.span>
              )}
            </motion.button>

            <LayoutGroup id={`${item.id}`}>
              <AnimatePresence mode="popLayout">
                {isOpen ? (
                  <motion.div className="flex w-full flex-col">
                    <div className="w-full">
                      <motion.div
                        initial={{ y: 0, opacity: 0, filter: "blur(4px)" }}
                        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                        transition={{ type: "spring", duration: 0.15 }}
                        layout
                        className="w-full"
                      >
                        <DirectionAwareTabs
                          className="mr-auto bg-transparent pr-2"
                          rounded="rounded"
                          tabs={tabs}
                          onChange={() => setTabChangeRerender(tabChangeRerender + 1)}
                        />
                      </motion.div>
                    </div>

                    <motion.div
                      key={`re-render-${tabChangeRerender}`}
                      className="mb-2 flex w-full items-center justify-between pl-2"
                      initial={{ opacity: 0, filter: "blur(4px)" }}
                      animate={{ opacity: 1, filter: "blur(0px)" }}
                      transition={{ type: "spring", bounce: 0, duration: 0.55 }}
                    >
                      <motion.div className="flex items-center gap-2 pt-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#13EEE3]" />
                        <span className="text-xs text-neutral-300/80">Changes</span>
                      </motion.div>
                      <motion.div layout className="ml-auto mr-1 pt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setOpenItemId(null)
                            toast.info("Changes saved")
                          }}
                          className="h-7 rounded-lg bg-[#13EEE3]/80 hover:bg-[#13EEE3] hover:text-black text-black"
                        >
                          Apply Changes
                        </Button>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </LayoutGroup>
          </div>
        )}
      />
    )
  }

  return (
    <div className="md:px-4 w-full max-w-4xl mx-auto">
      <div className="mb-9 rounded-2xl p-2 shadow-sm md:p-6 dark:bg-[#151515]/50 bg-black">
        <div className="overflow-auto p-1 md:p-4">
          <div className="flex flex-col space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Target className="h-8 w-8 text-[#13EEE3]" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Focus Todo AI</h1>
                  <p className="text-sm text-neutral-400">AI-powered task prioritization and focus management</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={organizeWithAI}
                  disabled={isOrganizing}
                  className="bg-[#13EEE3] hover:bg-[#13EEE3]/90 text-black font-medium"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  {isOrganizing ? "Organizing..." : "AI Organize"}
                </Button>
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-neutral-900/50">
              <div>
                <label className="text-xs text-neutral-400 block mb-2">Available Time (minutes)</label>
                <input
                  type="number"
                  value={totalTimeAvailable}
                  onChange={(e) => setTotalTimeAvailable(parseInt(e.target.value) || 60)}
                  className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white"
                  min="30"
                  step="15"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-2">Focus Mode</label>
                <select
                  value={focusMode}
                  onChange={(e) => setFocusMode(e.target.value as typeof focusMode)}
                  className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white"
                >
                  <option value="balanced">Balanced</option>
                  <option value="urgent">Urgent First</option>
                  <option value="deadline">Deadline Priority</option>
                  <option value="complexity">Simple First</option>
                </select>
              </div>
              <div className="flex items-end space-x-2">
                <Button
                  disabled={items?.length > 10}
                  onClick={handleAddItem}
                  variant="outline"
                  size="sm"
                  className="border-neutral-700 hover:border-[#13EEE3]/50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Task
                </Button>
                <Button
                  onClick={handleResetItems}
                  variant="outline"
                  size="sm"
                  className="border-neutral-700 hover:border-neutral-500"
                >
                  <RepeatIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Current Focus Session */}
            {currentFocusItem && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-xl bg-gradient-to-r from-[#13EEE3]/10 to-[#13EEE3]/5 border border-[#13EEE3]/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-[#13EEE3]" />
                    <div>
                      <h3 className="font-medium text-white">Focus Session Active</h3>
                      <p className="text-sm text-neutral-300">{currentFocusItem.text}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setCurrentFocusItem(null)}
                    variant="ghost"
                    size="sm"
                  >
                    End Session
                  </Button>
                </div>
                <FocusTimer
                  initialMinutes={Math.max(5, Math.min(60, currentFocusItem.estimatedMinutes))}
                  onComplete={endFocusSession}
                />
              </motion.div>
            )}

            {/* Todo List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Tasks</h2>
                <div className="text-sm text-neutral-400">
                  {items.filter(item => !item.checked).length} remaining • {items.reduce((acc, item) => acc + item.estimatedMinutes, 0)} min total
                </div>
              </div>
              <SortableList
                items={items}
                setItems={setItems}
                onCompleteItem={handleCompleteItem}
                renderItem={renderListItem}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
