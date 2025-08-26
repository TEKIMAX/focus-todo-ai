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

    // Test connection to Ollama
    try {
      const response = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(5000)
      })

      if (!response.ok) {
        return NextResponse.json({
          isValid: false,
          error: `Ollama server responded with ${response.status}`
        } as ModelValidationResult)
      }

      const data: OllamaResponse = await response.json()
      
      return NextResponse.json({
        isValid: true,
        models: data.models || []
      } as ModelValidationResult)

    } catch (error) {
      console.error('Ollama connection error:', error)
      
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          return NextResponse.json({
            isValid: false,
            error: 'Connection timeout - is Ollama running?'
          } as ModelValidationResult)
        }
        
        if (error.message.includes('ECONNREFUSED')) {
          return NextResponse.json({
            isValid: false,
            error: 'Connection refused - is Ollama running on this URL?'
          } as ModelValidationResult)
        }
      }
      
      return NextResponse.json({
        isValid: false,
        error: 'Failed to connect to Ollama server'
      } as ModelValidationResult)
    }
  } catch (error) {
    console.error('Error testing Ollama connection:', error)
    return NextResponse.json({
      isValid: false,
      error: 'Internal server error'
    } as ModelValidationResult)
  }
}
