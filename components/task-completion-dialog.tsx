"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X, Clock, AlertCircle, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { TodoItem } from "@/lib/types"

interface TaskCompletionDialogProps {
  isOpen: boolean
  todo: TodoItem | null
  timeSpent: number
  onComplete: (completed: boolean, notes?: string) => void
  onClose: () => void
}

export function TaskCompletionDialog({ 
  isOpen, 
  todo, 
  timeSpent, 
  onComplete, 
  onClose 
}: TaskCompletionDialogProps) {
  const [notes, setNotes] = useState("")
  const [selectedReason, setSelectedReason] = useState<string | null>(null)

  const formatTime = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }, [])

  const incompleteReasons = [
    "Need more information",
    "Waiting for someone else", 
    "Technical difficulties",
    "Not enough time",
    "Task was harder than expected",
    "Got interrupted",
    "Other priority came up"
  ]

  const handleComplete = useCallback((completed: boolean) => {
    onComplete(completed, notes || selectedReason || undefined)
    setNotes("")
    setSelectedReason(null)
  }, [notes, selectedReason, onComplete])

  if (!todo) return null

  const estimatedVsActual = timeSpent - todo.estimatedMinutes
  const isOvertime = estimatedVsActual > 5 // More than 5 minutes over

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 w-full max-w-md"
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">Focus session complete</h2>
              <div className="text-neutral-400 text-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="h-4 w-4" />
                  <span>Time spent: {formatTime(timeSpent)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>Estimated: {formatTime(todo.estimatedMinutes)}</span>
                  {isOvertime && (
                    <span className="text-orange-400">
                      (+{formatTime(estimatedVsActual)} over)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-2">{todo.text}</h3>
              {todo.description && (
                <p className="text-neutral-400 text-sm">{todo.description}</p>
              )}
            </div>

            <div className="mb-6">
              <h4 className="text-white mb-3">Did you complete this task?</h4>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Button
                  onClick={() => handleComplete(true)}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center space-x-2"
                >
                  <Check className="h-4 w-4" />
                  <span>Yes, completed</span>
                </Button>
                
                <Button
                  onClick={() => handleComplete(false)}
                  variant="outline"
                  className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white flex items-center justify-center space-x-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>Not finished</span>
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-neutral-400">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm">Add notes (optional)</span>
                </div>
                
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any thoughts, blockers, or next steps..."
                  className="w-full p-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 resize-none focus:outline-none focus:ring-2 focus:ring-[#13EEE3]"
                  rows={3}
                />

                {!notes && (
                  <div>
                    <div className="text-sm text-neutral-500 mb-2">Quick reasons:</div>
                    <div className="flex flex-wrap gap-2">
                      {incompleteReasons.map((reason) => (
                        <button
                          key={reason}
                          onClick={() => setSelectedReason(
                            selectedReason === reason ? null : reason
                          )}
                          className={cn(
                            "px-3 py-1 text-xs rounded-full border transition-colors",
                            selectedReason === reason
                              ? "bg-orange-500 text-white border-orange-500"
                              : "text-neutral-400 border-neutral-600 hover:border-neutral-500"
                          )}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-neutral-400 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
