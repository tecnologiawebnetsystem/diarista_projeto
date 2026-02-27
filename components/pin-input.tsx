'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface PinInputProps {
  length?: number
  onComplete: (pin: string) => void
  onError?: () => void
  error?: boolean
}

export function PinInput({ length = 6, onComplete, onError, error = false }: PinInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    // Reset on error
    if (error) {
      setValues(Array(length).fill(''))
      inputRefs.current[0]?.focus()
    }
  }, [error, length])

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newValues = [...values]
    newValues[index] = value

    setValues(newValues)

    // Auto-focus next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Check if complete
    if (newValues.every(v => v !== '')) {
      onComplete(newValues.join(''))
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const newValues = [...values]
      
      if (values[index]) {
        // Clear current
        newValues[index] = ''
        setValues(newValues)
      } else if (index > 0) {
        // Clear previous and focus
        newValues[index - 1] = ''
        setValues(newValues)
        inputRefs.current[index - 1]?.focus()
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, length)
    
    if (!/^\d+$/.test(pastedData)) return

    const newValues = [...values]
    pastedData.split('').forEach((char, i) => {
      if (i < length) newValues[i] = char
    })
    
    setValues(newValues)
    
    const lastFilledIndex = Math.min(pastedData.length - 1, length - 1)
    inputRefs.current[lastFilledIndex]?.focus()

    if (newValues.every(v => v !== '')) {
      onComplete(newValues.join(''))
    }
  }

  return (
    <div className="flex gap-3 justify-center">
      {values.map((value, index) => (
        <input
          key={index}
          ref={el => { inputRefs.current[index] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value}
          onChange={e => handleChange(index, e.target.value)}
          onKeyDown={e => handleKeyDown(index, e)}
          onPaste={index === 0 ? handlePaste : undefined}
          className={cn(
            "w-14 h-16 text-center text-2xl font-bold rounded-lg border-2 transition-all",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
            error 
              ? "border-destructive bg-destructive/10 animate-pulse" 
              : "border-input bg-background hover:border-primary/50"
          )}
          aria-label={`PIN digit ${index + 1}`}
        />
      ))}
    </div>
  )
}
