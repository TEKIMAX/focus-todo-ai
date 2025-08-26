import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText, generateObject } from 'ai'
import { z } from 'zod'

// Helper function to get AI provider based on settings
async function getAIProvider(request: NextRequest) {
  try {
    const body = await request.json()
    const { appSettings, ...otherData } = body

    if (!appSettings) {
      // Default to OpenAI with environment API key
      return {
        provider: openai('gpt-5', { reasoningEffort: 'medium' }),
        data: otherData
      }
    }

    if (appSettings.aiProvider === 'ollama') {
      // Create Ollama provider
      const ollamaProvider = createOpenAI({
        baseURL: `${appSettings.ollamaBaseUrl}/v1`,
        apiKey: 'ollama', // Ollama doesn't require a real API key
      })

      const modelName = appSettings.selectedModel || 'llama2'
      
      return {
        provider: ollamaProvider(modelName),
        data: otherData
      }
    } else {
      // Use OpenAI
      const apiKey = appSettings.openaiApiKey || process.env.OPENAI_API_KEY
      
      if (!apiKey) {
        throw new Error('OpenAI API key not configured')
      }

      const openaiProvider = createOpenAI({
        apiKey: apiKey
      })

      return {
        provider: openaiProvider('gpt-5', { reasoningEffort: 'medium' }),
        data: otherData
      }
    }
  } catch (error) {
    throw new Error(`Failed to configure AI provider: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { provider, data } = await getAIProvider(request)
    const { type, ...requestData } = data

    switch (type) {
      case 'organize-todos':
        return await handleOrganizeTodos(provider, requestData)
      case 'generate-questions': 
        return await handleGenerateQuestions(provider, requestData)
      case 'generate-daily-plan':
        return await handleGenerateDailyPlan(provider, requestData)
      case 'rewrite-description':
        return await handleRewriteDescription(provider, requestData)
      default:
        return NextResponse.json(
          { error: 'Invalid request type' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('AI Generation Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleOrganizeTodos(provider: any, data: any) {
  const todoItemSchema = z.object({
    id: z.number(),
    text: z.string(),
    description: z.string(),
    checked: z.boolean(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    complexity: z.enum(['simple', 'moderate', 'complex']),
    estimatedMinutes: z.number(),
    order: z.number(),
    tags: z.array(z.string()).optional(),
    deadline: z.string().optional(),
    createdAt: z.string(),
    completedAt: z.string().optional(),
    focusTimeSpent: z.number().optional(),
    attempts: z.number().optional(),
    isCurrentlyActive: z.boolean().optional(),
    progressStatus: z.enum(['not-started', 'in-progress', 'completed', 'needs-clarification']).optional(),
  })

  const organizeResponseSchema = z.object({
    organizedTodos: z.array(todoItemSchema),
    reasoning: z.string(),
  })

  const result = await generateObject({
    model: provider,
    schema: organizeResponseSchema,
    prompt: `You are an AI assistant helping to organize and prioritize todo items for maximum productivity.

Given these todo items and constraints:
- Available time: ${data.totalAvailableMinutes} minutes
- Focus mode: ${data.focusMode}
- Current todos: ${JSON.stringify(data.todos)}

Please reorganize these todos by:
1. Prioritizing based on urgency, importance, and deadlines
2. Optimizing the order for energy levels and context switching
3. Ensuring the total estimated time fits within available minutes
4. Grouping similar tasks when possible

Return the todos in the optimal order with updated priorities and provide reasoning for your organization strategy.`,
  })

  // Add manual defaults for missing fields
  const organizedTodos = result.object.organizedTodos.map((todo, index) => ({
    ...todo,
    checked: todo.checked ?? false,
    createdAt: todo.createdAt || new Date().toISOString(),
    deadline: todo.deadline ? new Date(todo.deadline) : undefined,
    focusTimeSpent: todo.focusTimeSpent ?? 0,
    attempts: todo.attempts ?? 0,
    isCurrentlyActive: todo.isCurrentlyActive ?? false,
    progressStatus: todo.progressStatus ?? 'not-started',
    order: index + 1
  }))

  return NextResponse.json({
    organizedTodos,
    reasoning: result.object.reasoning
  })
}

async function handleGenerateQuestions(provider: any, data: any) {
  const questionsSchema = z.object({
    questions: z.array(z.object({
      id: z.string(),
      question: z.string(),
      context: z.string(),
      answered: z.boolean(),
      followUp: z.boolean(),
    }))
  })

  const result = await generateObject({
    model: provider,
    schema: questionsSchema,
    prompt: `Based on this daily input: "${data.userInput}"

Generate 2-3 clarifying questions to better understand the user's day and priorities. Focus on:
- Missing time constraints or deadlines
- Unclear priorities or dependencies
- Specific requirements or constraints
- Energy levels or preferences

Be concise and specific. Avoid questions about obvious information already provided.`,
  })

  // Add manual defaults
  const questions = result.object.questions.map(q => ({
    ...q,
    answered: q.answered ?? false,
    followUp: q.followUp ?? false,
  }))

  return NextResponse.json({ questions })
}

async function handleGenerateDailyPlan(provider: any, data: any) {
  const todoItemSchema = z.object({
    id: z.number(),
    text: z.string(),
    description: z.string(),
    checked: z.boolean(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    complexity: z.enum(['simple', 'moderate', 'complex']),
    estimatedMinutes: z.number(),
    order: z.number(),
    tags: z.array(z.string()).optional(),
    deadline: z.string().optional(),
    createdAt: z.string(),
    completedAt: z.string().optional(),
    focusTimeSpent: z.number().optional(),
    attempts: z.number().optional(),
    isCurrentlyActive: z.boolean().optional(),
    progressStatus: z.enum(['not-started', 'in-progress', 'completed', 'needs-clarification']).optional(),
  })

  const dailyPlanSchema = z.object({
    todos: z.array(todoItemSchema),
    reasoning: z.string(),
  })

  const questionsContext = data.answeredQuestions.map((q: any) => 
    `Q: ${q.question}\nA: ${q.answer}`
  ).join('\n\n')

  const result = await generateObject({
    model: provider,
    schema: dailyPlanSchema,
    prompt: `Create a detailed daily plan based on:

User Input: "${data.userInput}"
Available Time: ${data.availableHours} hours (${data.startTime} - ${data.endTime})
Today's Date: ${data.currentDate}

Additional Context:
${questionsContext}

Break down the work into specific, actionable todos with:
- Clear task descriptions
- Realistic time estimates
- Appropriate priorities
- Proper sequencing
- Consideration for energy levels throughout the day

Ensure total estimated time doesn't exceed available time. Include small breaks between tasks.`,
  })

  // Add manual defaults for missing fields
  const todos = result.object.todos.map((todo, index) => ({
    ...todo,
    checked: todo.checked ?? false,
    createdAt: todo.createdAt || new Date().toISOString(),
    deadline: todo.deadline ? new Date(todo.deadline) : undefined,
    focusTimeSpent: todo.focusTimeSpent ?? 0,
    attempts: todo.attempts ?? 0,
    isCurrentlyActive: todo.isCurrentlyActive ?? false,
    progressStatus: todo.progressStatus ?? 'not-started',
    order: index + 1
  }))

  return NextResponse.json({
    todos,
    reasoning: result.object.reasoning,
    isFinalized: true
  })
}

async function handleRewriteDescription(provider: any, data: any) {
  const result = await generateText({
    model: provider,
    prompt: `Take these bullet points and rewrite them into a detailed, flowing paragraph that captures all the important information:

Bullet Points:
${data.bulletPoints}

Create a comprehensive paragraph that:
- Flows naturally and reads well
- Includes all important details
- Maintains the timeline and priorities
- Adds context where helpful
- Uses professional but conversational tone

Return only the rewritten paragraph.`,
  })

  return NextResponse.json({ 
    rewrittenText: result.text 
  })
}
