import { NextRequest, NextResponse } from 'next/server'
import type { OllamaResponse, ModelValidationResult } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const { baseUrl } = await request.json()
    
    if (!baseUrl) {
      return NextResponse.json({
        isValid: false,
        error: 'Base URL is required'
      } as ModelValidationResult)
    }

    try {
      const response = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout for model refresh
      })

      if (!response.ok) {
        return NextResponse.json({
          isValid: false,
          error: `Failed to fetch models: ${response.status} ${response.statusText}`
        } as ModelValidationResult)
      }

      const data: OllamaResponse = await response.json()
      
      return NextResponse.json({
        isValid: true,
        models: data.models || []
      } as ModelValidationResult)

    } catch (error) {
      console.error('Error fetching Ollama models:', error)
      
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          return NextResponse.json({
            isValid: false,
            error: 'Request timeout while fetching models'
          } as ModelValidationResult)
        }
        
        if (error.message.includes('ECONNREFUSED')) {
          return NextResponse.json({
            isValid: false,
            error: 'Cannot connect to Ollama server'
          } as ModelValidationResult)
        }
      }
      
      return NextResponse.json({
        isValid: false,
        error: 'Failed to fetch models from Ollama'
      } as ModelValidationResult)
    }
  } catch (error) {
    console.error('Error in ollama-models route:', error)
    return NextResponse.json({
      isValid: false,
      error: 'Internal server error'
    } as ModelValidationResult)
  }
}
