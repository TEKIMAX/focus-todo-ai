"use client"

import { useState, useEffect, useCallback } from "react"
import { Play, Pause, RotateCcw, Settings } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FocusTimerProps {
  initialMinutes?: number
  onComplete?: () => void
  onTick?: (remainingSeconds: number) => void
  className?: string
}

export function FocusTimer({
  initialMinutes = 25,
  onComplete,
  onTick,
  className,
}: FocusTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [totalTime, setTotalTime] = useState(initialMinutes * 60)
  const [isBreak, setIsBreak] = useState(false)

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  const reset = useCallback(() => {
    setTimeLeft(totalTime)
    setIsRunning(false)
  }, [totalTime])

  const toggleTimer = useCallback(() => {
    setIsRunning(!isRunning)
  }, [isRunning])

  const startBreak = useCallback(() => {
    setIsBreak(true)
    setTimeLeft(5 * 60) // 5 minute break
    setTotalTime(5 * 60)
    setIsRunning(true)
  }, [])

  const startWork = useCallback(() => {
    setIsBreak(false)
    setTimeLeft(initialMinutes * 60)
    setTotalTime(initialMinutes * 60)
    setIsRunning(false)
  }, [initialMinutes])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          const newTime = time - 1
          onTick?.(newTime)
          return newTime
        })
      }, 1000)
    } else if (timeLeft === 0) {
      setIsRunning(false)
      onComplete?.()
      
      // Auto-start break or work cycle
      if (!isBreak) {
        startBreak()
      } else {
        startWork()
      }
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeLeft, onComplete, onTick, isBreak, startBreak, startWork])

  const progress = ((totalTime - timeLeft) / totalTime) * 100

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div className="relative">
        <svg
          className="w-32 h-32 transform -rotate-90"
          viewBox="0 0 120 120"
        >
          <circle
            cx="60"
            cy="60"
            r="54"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-neutral-800"
          />
          <motion.circle
            cx="60"
            cy="60"
            r="54"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={339.292}
            strokeDashoffset={339.292 - (progress / 100) * 339.292}
            className={cn(
              "transition-colors duration-500",
              isBreak ? "text-green-500" : "text-[#13EEE3]"
            )}
            strokeLinecap="round"
            initial={{ strokeDashoffset: 339.292 }}
            animate={{ strokeDashoffset: 339.292 - (progress / 100) * 339.292 }}
            transition={{ duration: 0.5 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            key={timeLeft}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-mono font-bold text-white"
          >
            {formatTime(timeLeft)}
          </motion.div>
          <div className="text-xs text-neutral-400 mt-1">
            {isBreak ? "Break" : "Focus"}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          onClick={toggleTimer}
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full bg-[#13EEE3]/10 hover:bg-[#13EEE3]/20"
        >
          <AnimatePresence mode="wait">
            {isRunning ? (
              <motion.div
                key="pause"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Pause className="h-6 w-6 text-[#13EEE3]" />
              </motion.div>
            ) : (
              <motion.div
                key="play"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Play className="h-6 w-6 text-[#13EEE3] ml-1" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>

        <Button
          onClick={reset}
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full hover:bg-neutral-800"
        >
          <RotateCcw className="h-4 w-4 text-neutral-400" />
        </Button>

        <Button
          onClick={() => setIsBreak(!isBreak)}
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-full px-4",
            isBreak 
              ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" 
              : "bg-[#13EEE3]/20 text-[#13EEE3] hover:bg-[#13EEE3]/30"
          )}
        >
          {isBreak ? "Break Mode" : "Focus Mode"}
        </Button>
      </div>

      <div className="text-center">
        <div className="text-sm text-neutral-400">
          {isBreak ? "Take a break and recharge" : "Stay focused on your task"}
        </div>
      </div>
    </div>
  )
}
