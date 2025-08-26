"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Check, Clock, Target, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TextGenerateEffect } from "@/components/ui/text-generate-effect"

interface TodoItem {
  id: number
  text: string
  completed: boolean
  timeEstimate: string
}

const demoTodos: TodoItem[] = [
  { id: 1, text: "Plan today's priorities", completed: false, timeEstimate: "5 min" },
  { id: 2, text: "Review project deadlines", completed: false, timeEstimate: "10 min" },
  { id: 3, text: "Schedule team meeting", completed: false, timeEstimate: "15 min" },
  { id: 4, text: "Complete design mockups", completed: false, timeEstimate: "45 min" },
  { id: 5, text: "Write weekly report", completed: false, timeEstimate: "30 min" },
]

export function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  const [todos, setTodos] = useState<TodoItem[]>(demoTodos)
  const [currentTodoIndex, setCurrentTodoIndex] = useState(0)
  const [isAutoChecking, setIsAutoChecking] = useState(false)

  // Auto-checking demo effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAutoChecking && currentTodoIndex < todos.length) {
        setTodos(prev => prev.map((todo, index) => 
          index === currentTodoIndex ? { ...todo, completed: true } : todo
        ))
        setCurrentTodoIndex(prev => prev + 1)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [currentTodoIndex, todos.length, isAutoChecking])

  // Start auto-checking after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAutoChecking(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Split Screen Layout */}
      <div className="flex h-screen">
        {/* Left Side - Content */}
        <div className="flex-1 flex flex-col justify-center px-12 lg:px-20 xl:px-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            {/* Main Heading */}
            <div className="mb-8">
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold mb-6">
                <span className="text-white">Focus</span>
                <span className="text-blue-400">Todo</span>
                <span className="text-white">AI</span>
              </h1>
              
              <TextGenerateEffect
                words="Transform your productivity with AI-powered task management. Plan smarter, focus deeper, achieve more."
                className="text-xl lg:text-2xl text-gray-300 leading-relaxed"
                duration={1.5}
                filter={true}
              />
            </div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="space-y-4 mb-8"
            >
              <div className="flex items-center space-x-3">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">AI-powered task organization</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Smart time estimation & focus timer</span>
              </div>
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Personalized daily planning</span>
              </div>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.8 }}
            >
              <Button
                onClick={onGetStarted}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Side - Video/Demo */}
        <div className="flex-1 bg-gray-900 relative overflow-hidden">
          {/* Video Placeholder */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-400">Demo Video</p>
              </div>
            </div>
          </div>

          {/* Floating Todo Demo */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2, duration: 0.8 }}
            className="absolute top-20 right-8 w-80 bg-gray-800/90 backdrop-blur-sm rounded-xl border border-gray-700 p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Today's Tasks</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400">Live Demo</span>
              </div>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {todos.map((todo, index) => (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                      todo.completed 
                        ? 'bg-green-500/20 border border-green-500/30' 
                        : 'bg-gray-700/50 border border-gray-600/30'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        todo.completed 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-400'
                      }`}>
                        {todo.completed && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </div>
                      <span className={`text-sm transition-all duration-300 ${
                        todo.completed ? 'text-green-400 line-through' : 'text-gray-300'
                      }`}>
                        {todo.text}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{todo.timeEstimate}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Progress</span>
                <span>{todos.filter(t => t.completed).length}/{todos.length}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(todos.filter(t => t.completed).length / todos.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>

          {/* Floating Stats */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3, duration: 0.8 }}
            className="absolute bottom-20 left-8 bg-gray-800/90 backdrop-blur-sm rounded-xl border border-gray-700 p-6 shadow-2xl"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                <motion.span
                  initial={{ number: 0 }}
                  animate={{ number: 87 }}
                  transition={{ duration: 2, delay: 3.5 }}
                >
                  {Math.round(87)}%
                </motion.span>
              </div>
              <p className="text-sm text-gray-400">Productivity Boost</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-400/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  )
}
