"use client"

import { motion } from "framer-motion"
import { Clock, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProgressBadge as ProgressBadgeType } from "@/lib/types"

interface ProgressBadgeProps {
  progress: ProgressBadgeType
  className?: string
}

export function ProgressBadge({ progress, className }: ProgressBadgeProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const getStatusConfig = () => {
    if (progress.status === 'danger') {
      return {
        bgColor: 'bg-red-500/20',
        textColor: 'text-red-400',
        borderColor: 'border-red-500/50',
        icon: AlertTriangle,
        label: 'Overdue'
      }
    }
    
    if (progress.status === 'warning') {
      return {
        bgColor: 'bg-orange-500/20',
        textColor: 'text-orange-400', 
        borderColor: 'border-orange-500/50',
        icon: Clock,
        label: 'Running late'
      }
    }
    
    if (progress.status === 'success') {
      return {
        bgColor: 'bg-green-500/20',
        textColor: 'text-green-400',
        borderColor: 'border-green-500/50', 
        icon: CheckCircle,
        label: 'On track'
      }
    }
    
    return {
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-500/50',
      icon: Info,
      label: 'In progress'
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        "flex items-center space-x-2 px-3 py-2 rounded-full border text-xs font-medium",
        config.bgColor,
        config.textColor,
        config.borderColor,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
      {progress.timeRemaining !== undefined && (
        <span className="ml-1">
          • {formatTime(progress.timeRemaining)} left
        </span>
      )}
      {progress.percentage !== undefined && (
        <div className="flex items-center space-x-1">
          <div className="w-8 h-1 bg-neutral-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.5 }}
              className={cn(
                "h-full rounded-full",
                progress.status === 'danger' ? 'bg-red-500' :
                progress.status === 'warning' ? 'bg-orange-500' :
                progress.status === 'success' ? 'bg-green-500' : 'bg-blue-500'
              )}
            />
          </div>
          <span className="text-xs">{Math.round(progress.percentage)}%</span>
        </div>
      )}
    </motion.div>
  )
}
