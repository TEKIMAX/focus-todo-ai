"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { Settings, Clock, User, Bot, X, Save, Calendar, Target, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DirectionAwareTabs } from "@/components/ui/direction-aware-tabs"
import { cn } from "@/lib/utils"
import { TodoItem, TodoUpdateLog } from "@/lib/types"

interface TodoDetailPanelProps {
  todo: TodoItem
  isOpen: boolean
  onClose: () => void
  onUpdate: (updates: Partial<TodoItem>, updatedBy: 'human' | 'ai', context?: string) => void
}

export function TodoDetailPanel({ todo, isOpen, onClose, onUpdate }: TodoDetailPanelProps) {
  const [editedTodo, setEditedTodo] = useState<TodoItem>(todo)
  const [hasChanges, setHasChanges] = useState(false)

  const handleFieldChange = useCallback((field: keyof TodoItem, value: any) => {
    setEditedTodo(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }, [])

  const handleSave = useCallback(() => {
    const changes: Partial<TodoItem> = {}
    
    // Check what fields have changed
    Object.keys(editedTodo).forEach(key => {
      const field = key as keyof TodoItem
      if (editedTodo[field] !== todo[field] && field !== 'updateLog') {
        changes[field] = editedTodo[field]
      }
    })

    if (Object.keys(changes).length > 0) {
      onUpdate(changes, 'human', 'Manual edit from detail panel')
    }
    
    setHasChanges(false)
  }, [editedTodo, todo, onUpdate])

  const formatTimestamp = useCallback((date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(dateObj)
  }, [])

  const getUpdateIcon = useCallback((updatedBy: 'ai' | 'human') => {
    return updatedBy === 'ai' ? (
      <Bot className="w-3 h-3 text-[#13EEE3]" />
    ) : (
      <User className="w-3 h-3 text-blue-400" />
    )
  }, [])

  const tabs = [
    {
      id: 0,
      label: "Title",
      content: (
        <div className="flex w-full flex-col pr-2 py-2">
          <motion.div
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.75, delay: 0.15 }}
          >
            <label className="text-xs text-neutral-400 mb-2 block">
              Task title
            </label>
            <input
              type="text"
              value={editedTodo.text}
              onChange={(e) => handleFieldChange('text', e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-lg font-semibold text-white placeholder:text-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13EEE3]/80"
              placeholder="Enter task title..."
            />
          </motion.div>
        </div>
      ),
    },
    {
      id: 1,
      label: "Description",
      content: (
        <div className="flex flex-col pr-2 py-2">
          <motion.div
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.75, delay: 0.15 }}
          >
            <label className="text-xs text-neutral-400 mb-2 block">
              Detailed description of what needs to be done
            </label>
            <textarea
              className="h-32 w-full resize-none rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13EEE3]/80"
              value={editedTodo.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Describe what needs to be accomplished..."
            />
          </motion.div>
        </div>
      ),
    },
    {
      id: 2,
      label: "Properties", 
      content: (
        <div className="flex flex-col pr-2 py-2 space-y-4">
          <motion.div
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.75, delay: 0.15 }}
            className="space-y-4"
          >
            {/* Priority */}
            <div>
              <label className="text-xs text-neutral-400 mb-2 block">Priority</label>
              <select
                value={editedTodo.priority}
                onChange={(e) => handleFieldChange('priority', e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13EEE3]/80"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Complexity */}
            <div>
              <label className="text-xs text-neutral-400 mb-2 block">Complexity</label>
              <select
                value={editedTodo.complexity}
                onChange={(e) => handleFieldChange('complexity', e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13EEE3]/80"
              >
                <option value="simple">Simple</option>
                <option value="moderate">Moderate</option>
                <option value="complex">Complex</option>
              </select>
            </div>

            {/* Estimated Minutes */}
            <div>
              <label className="text-xs text-neutral-400 mb-2 block">Estimated time (minutes)</label>
              <input
                type="number"
                min="1"
                max="480"
                value={editedTodo.estimatedMinutes}
                onChange={(e) => handleFieldChange('estimatedMinutes', parseInt(e.target.value))}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13EEE3]/80"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="text-xs text-neutral-400 mb-2 block">Deadline (optional)</label>
              <input
                type="datetime-local"
                value={editedTodo.deadline ? (() => {
                  const deadline = editedTodo.deadline instanceof Date ? editedTodo.deadline : new Date(editedTodo.deadline)
                  return new Date(deadline.getTime() - deadline.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                })() : ''}
                onChange={(e) => handleFieldChange('deadline', e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13EEE3]/80"
              />
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      id: 3,
      label: "History",
      content: (
        <div className="flex flex-col pr-2 py-2">
          <motion.div
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.75, delay: 0.15 }}
          >
            <label className="text-xs text-neutral-400 mb-3 block">
              Update timeline
            </label>
            <div className="max-h-48 overflow-y-auto space-y-3">
              {/* Creation entry */}
              <div className="flex items-start space-x-3 p-3 bg-neutral-800/50 rounded-lg">
                <Target className="w-3 h-3 text-green-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-green-400">Created</span>
                    <span className="text-xs text-neutral-500">{formatTimestamp(editedTodo.createdAt)}</span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">Task was created</p>
                </div>
              </div>

              {/* Update log entries */}
              {editedTodo.updateLog?.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 p-3 bg-neutral-800/30 rounded-lg">
                  {getUpdateIcon(log.updatedBy)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white capitalize">{log.field} updated</span>
                      <span className="text-xs text-neutral-500">{formatTimestamp(log.timestamp)}</span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      {log.updatedBy === 'ai' ? 'AI' : 'Human'}: {log.context || 'Updated value'}
                    </p>
                    {log.oldValue !== log.newValue && (
                      <div className="text-xs mt-2">
                        <span className="text-red-400">- {log.oldValue}</span>
                        <br />
                        <span className="text-green-400">+ {log.newValue}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {(!editedTodo.updateLog || editedTodo.updateLog.length === 0) && (
                <div className="text-center text-neutral-500 text-xs py-4">
                  No updates yet
                </div>
              )}
            </div>
          </motion.div>
        </div>
      ),
    },
  ]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-[#13EEE3]" />
              <h2 className="text-lg font-semibold text-white">Task Details</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <LayoutGroup>
            <div className="overflow-auto" style={{ maxHeight: 'calc(80vh - 160px)' }}>
              <DirectionAwareTabs tabs={tabs} />
            </div>

            <AnimatePresence>
              {hasChanges && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-800"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-[#13EEE3]" />
                    <span className="text-xs text-neutral-300">Unsaved changes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditedTodo(todo)
                        setHasChanges(false)
                      }}
                      className="text-neutral-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      className="bg-[#13EEE3] hover:bg-[#13EEE3]/80 text-black"
                    >
                      <Save className="w-3 h-3 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </LayoutGroup>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
