"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Calendar, Clock, CheckCircle, Target, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { DailyPlan } from "@/lib/types"

interface HistoryPageProps {
  onClose: () => void
  getDailyPlans: () => DailyPlan[]
}

export function HistoryPage({ onClose, getDailyPlans }: HistoryPageProps) {
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<DailyPlan | null>(null)

  useEffect(() => {
    const plans = getDailyPlans()
    setDailyPlans(plans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
  }, [getDailyPlans])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const getCompletionRate = (plan: DailyPlan) => {
    if (plan.todos.length === 0) return 0
    const completed = plan.todos.filter(todo => todo.checked).length
    return Math.round((completed / plan.todos.length) * 100)
  }

  const getTotalTimeSpent = (plan: DailyPlan) => {
    return plan.todos.reduce((total, todo) => total + (todo.focusTimeSpent || 0), 0)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  if (selectedPlan) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              onClick={() => setSelectedPlan(null)}
              variant="ghost"
              size="sm"
              className="text-neutral-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">{formatDate(selectedPlan.date)}</h1>
              <p className="text-neutral-400">Daily Plan Details</p>
            </div>
          </div>

          {/* Plan Overview */}
          <Card className="bg-gray-900 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Plan Overview</CardTitle>
              <CardDescription className="text-gray-400">
                {selectedPlan.startTime} - {selectedPlan.endTime} • {selectedPlan.availableHours} hours available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {getCompletionRate(selectedPlan)}%
                  </div>
                  <div className="text-sm text-gray-400">Completion Rate</div>
                </div>
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {selectedPlan.todos.length}
                  </div>
                  <div className="text-sm text-gray-400">Total Tasks</div>
                </div>
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    {getTotalTimeSpent(selectedPlan)}m
                  </div>
                  <div className="text-sm text-gray-400">Time Spent</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Todos List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Tasks</h2>
            {selectedPlan.todos.map((todo, index) => (
              <motion.div
                key={todo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border transition-all duration-300 ${
                  todo.checked 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-gray-900 border-gray-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(todo.priority)}`}></div>
                      <span className={`font-medium ${todo.checked ? 'text-green-400 line-through' : 'text-white'}`}>
                        {todo.text}
                      </span>
                      {todo.checked && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                    {todo.description && (
                      <p className="text-gray-400 text-sm mb-2">{todo.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Est: {todo.estimatedMinutes}m</span>
                      {todo.focusTimeSpent && todo.focusTimeSpent > 0 && (
                        <span>Spent: {todo.focusTimeSpent}m</span>
                      )}
                      {todo.attempts && todo.attempts > 0 && (
                        <span>Attempts: {todo.attempts}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {todo.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {todo.complexity}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
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
            <h1 className="text-2xl font-bold text-white">History</h1>
            <p className="text-neutral-400">View your past daily plans and progress</p>
          </div>
        </div>

        {dailyPlans.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No History Yet</h3>
            <p className="text-gray-500">Complete your first daily plan to see it here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {dailyPlans.map((plan, index) => (
                <motion.div
                  key={plan.date.toISOString()}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className="bg-gray-900 border-gray-800 hover:border-gray-700 cursor-pointer transition-all duration-300 hover:bg-gray-800/50"
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-lg">
                          {formatDate(plan.date)}
                        </CardTitle>
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                      </div>
                      <CardDescription className="text-gray-400">
                        {plan.startTime} - {plan.endTime}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between text-sm text-gray-400 mb-2">
                            <span>Progress</span>
                            <span>{getCompletionRate(plan)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <motion.div
                              className="bg-blue-500 h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${getCompletionRate(plan)}%` }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-center p-3 bg-gray-800 rounded-lg">
                            <div className="text-lg font-bold text-white">{plan.todos.length}</div>
                            <div className="text-gray-400">Tasks</div>
                          </div>
                          <div className="text-center p-3 bg-gray-800 rounded-lg">
                            <div className="text-lg font-bold text-green-400">
                              {plan.todos.filter(t => t.checked).length}
                            </div>
                            <div className="text-gray-400">Completed</div>
                          </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Time Spent: {getTotalTimeSpent(plan)}m</span>
                          <span>Available: {plan.availableHours}h</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
