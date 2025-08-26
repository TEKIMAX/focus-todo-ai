"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Clock, Target, Brain, ChevronRight, Check, Plus, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTodoStore } from "@/lib/store"
import { OnboardingData, AIQuestion, DailyPlan } from "@/lib/types"

interface DailyOnboardingProps {
  onComplete: (plan: DailyPlan) => void
  onSkip: () => void
}

export function DailyOnboarding({ onComplete, onSkip }: DailyOnboardingProps) {
  const { appSettings } = useTodoStore()
  const [step, setStep] = useState(0)
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    dailyDescription: "",
    availableTime: 8,
    startTime: "09:00",
    endTime: "17:00",
    priorities: [],
    currentDate: new Date(),
  })
  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([])
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [isGeneratingTodos, setIsGeneratingTodos] = useState(false)
  const [newPriority, setNewPriority] = useState("")
  const [isRewriting, setIsRewriting] = useState(false)
  const [bulletPoints, setBulletPoints] = useState("")
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  const handleDescriptionSubmit = useCallback(async () => {
    if (!onboardingData.dailyDescription.trim()) return
    
    const controller = new AbortController()
    setAbortController(controller)
    setIsGeneratingQuestions(true)
    
    try {
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'generate-questions',
          userInput: onboardingData.dailyDescription,
          availableTime: onboardingData.availableTime,
          startTime: onboardingData.startTime,
          endTime: onboardingData.endTime,
          appSettings
        }),
        signal: controller.signal
      })

      if (response.ok) {
        const { questions } = await response.json()
        setAiQuestions(questions)
        setStep(2)
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Question generation cancelled')
      } else {
        console.error('Error generating questions:', error)
      }
    } finally {
      setIsGeneratingQuestions(false)
      setAbortController(null)
    }
  }, [onboardingData])

  const handleQuestionAnswer = useCallback((questionId: string, answer: string) => {
    setAiQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, answered: true, answer } : q
    ))
  }, [])

  const handleGenerateTodos = useCallback(async () => {
    const allQuestionsAnswered = aiQuestions.every(q => q.answered)
    if (!allQuestionsAnswered) return

    const controller = new AbortController()
    setAbortController(controller)
    setIsGeneratingTodos(true)
    
    try {
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'generate-daily-plan',
          userInput: onboardingData.dailyDescription,
          availableTime: onboardingData.availableTime,
          startTime: onboardingData.startTime,
          endTime: onboardingData.endTime,
          currentDate: onboardingData.currentDate.toISOString(),
          answeredQuestions: aiQuestions.filter(q => q.answered).map(q => ({
            question: q.question,
            answer: q.answer
          })),
          appSettings
        }),
        signal: controller.signal
      })

      if (response.ok) {
        const dailyPlan: DailyPlan = await response.json()
        onComplete(dailyPlan)
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Daily plan generation cancelled')
      } else {
        console.error('Error generating daily plan:', error)
      }
    } finally {
      setIsGeneratingTodos(false)
      setAbortController(null)
    }
  }, [onboardingData, aiQuestions, onComplete])

  const addPriority = useCallback(() => {
    if (newPriority.trim() && !onboardingData.priorities.includes(newPriority.trim())) {
      setOnboardingData(prev => ({
        ...prev,
        priorities: [...prev.priorities, newPriority.trim()]
      }))
      setNewPriority("")
    }
  }, [newPriority, onboardingData.priorities])

  const removePriority = useCallback((priority: string) => {
    setOnboardingData(prev => ({
      ...prev,
      priorities: prev.priorities.filter(p => p !== priority)
    }))
  }, [])

  const handleAIRewrite = useCallback(async () => {
    if (!bulletPoints.trim()) return
    
    const controller = new AbortController()
    setAbortController(controller)
    setIsRewriting(true)
    
    try {
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rewrite-description',
          bulletPoints: bulletPoints.trim(),
          appSettings
        }),
        signal: controller.signal
      })

      if (response.ok) {
        const { rewrittenText } = await response.json()
        setOnboardingData(prev => ({ ...prev, dailyDescription: rewrittenText }))
        setBulletPoints("")
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('AI rewrite cancelled')
      } else {
        console.error('Error rewriting description:', error)
      }
    } finally {
      setIsRewriting(false)
      setAbortController(null)
    }
  }, [bulletPoints])

  const handleStopGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
      setIsGeneratingQuestions(false)
      setIsGeneratingTodos(false)
      setIsRewriting(false)
    }
  }, [abortController])

  const steps = [
    {
      title: "Tell me about your day",
      description: "Describe what you have on your plate today in as much detail as possible",
      component: (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-sm text-neutral-400">
            <Calendar className="h-4 w-4" />
            <span>{onboardingData.currentDate.toLocaleDateString()}</span>
          </div>
          
          <div className="space-y-3">
            <textarea
              value={onboardingData.dailyDescription}
              onChange={(e) => setOnboardingData(prev => ({ ...prev, dailyDescription: e.target.value }))}
              placeholder="Include dates, times, priorities, meetings, deadlines, projects you're working on, personal tasks, etc. The more detail the better!"
              className="w-full h-32 p-4 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <div className="border-t border-neutral-800 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-400">Need help writing? List your tasks and I'll help organize them:</span>
                <div className="flex items-center space-x-2">
                  {isRewriting && (
                    <Button
                      onClick={handleStopGeneration}
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Stop
                    </Button>
                  )}
                  <Button
                    onClick={handleAIRewrite}
                    disabled={!bulletPoints.trim() || isRewriting}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isRewriting ? (
                      <>
                        <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                        Writing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 mr-2" />
                        Help Write
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <textarea
                value={bulletPoints}
                onChange={(e) => setBulletPoints(e.target.value)}
                placeholder="• Meeting with John at 2pm&#10;• Finish project proposal&#10;• Call client about contract&#10;• Pick up groceries..."
                className="w-full h-20 p-3 bg-neutral-800 border border-neutral-600 rounded text-white placeholder-neutral-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              
              <div className="text-xs text-neutral-500 mt-2">
                Type a quick list of what you need to do today (use bullet points or line breaks)
              </div>
            </div>
          </div>
          
          <div className="text-xs text-neutral-500">
            Example: "I have a team meeting at 2pm, need to finish the quarterly report by Friday, pick up kids at 4pm, work on the new feature implementation, respond to client emails..."
          </div>
        </div>
      )
    },
    {
      title: "Set your schedule",
      description: "When are you available to work and what are your top priorities?",
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Start time</label>
              <input
                type="time"
                value={onboardingData.startTime}
                onChange={(e) => setOnboardingData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full p-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-2">End time</label>
              <input
                type="time"
                value={onboardingData.endTime}
                onChange={(e) => setOnboardingData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full p-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-neutral-400 mb-2">Key priorities for today</label>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPriority()}
                placeholder="Add a priority..."
                className="flex-1 p-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500"
              />
              <Button onClick={addPriority} size="icon" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {onboardingData.priorities.map((priority, index) => (
                <motion.div
                  key={priority}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center space-x-2 bg-neutral-800 text-white px-3 py-1 rounded-full text-sm"
                >
                  <span>{priority}</span>
                  <button onClick={() => removePriority(priority)}>
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "AI clarification",
      description: "Let me ask a few questions to better understand your needs",
      component: (
        <div className="space-y-4">
          {aiQuestions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-neutral-900 border border-neutral-700 rounded-lg"
            >
              <div className="flex items-start space-x-3">
                <Brain className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-white mb-3">{question.question}</p>
                  {question.answered ? (
                    <div className="flex items-center space-x-2 text-green-400">
                      <Check className="h-4 w-4" />
                      <span className="text-sm">{question.answer}</span>
                    </div>
                  ) : (
                    <textarea
                      placeholder="Your answer..."
                      onBlur={(e) => e.target.value && handleQuestionAnswer(question.id, e.target.value)}
                      className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded text-white placeholder-neutral-500 resize-none"
                      rows={2}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )
    }
  ]

  const currentStep = steps[step]
  const canProceed = step === 0 
    ? onboardingData.dailyDescription.trim().length > 20
    : step === 1
    ? onboardingData.startTime && onboardingData.endTime
    : step === 2
    ? aiQuestions.every(q => q.answered)
    : false

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-xl p-8"
      >
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Let's plan your day</h1>
            <Button variant="ghost" onClick={onSkip} className="text-neutral-400 hover:text-white">
              Skip for now
            </Button>
          </div>
          
          <div className="flex items-center space-x-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-2 rounded-full transition-colors",
                  index <= step ? "bg-blue-500" : "bg-neutral-700",
                  index === step ? "flex-1" : "w-8"
                )}
              />
            ))}
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">{currentStep.title}</h2>
            <p className="text-neutral-400">{currentStep.description}</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mb-8"
          >
            {currentStep.component}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0 || isGeneratingQuestions || isGeneratingTodos}
            className="text-neutral-400 hover:text-white"
          >
            Back
          </Button>

          <div className="flex items-center space-x-3">
            {(isGeneratingQuestions || isGeneratingTodos) && (
              <Button
                onClick={handleStopGeneration}
                variant="outline"
                className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
              >
                <X className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}
            
            {step < 2 ? (
              <Button
                onClick={step === 0 ? handleDescriptionSubmit : () => setStep(step + 1)}
                disabled={!canProceed || isGeneratingQuestions}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isGeneratingQuestions ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleGenerateTodos}
                disabled={!canProceed || isGeneratingTodos}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isGeneratingTodos ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                    Creating plan...
                  </>
                ) : (
                  <>
                    Generate my plan
                    <Target className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
