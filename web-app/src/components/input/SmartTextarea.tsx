import { noop } from '@/utils/utilsMisc'
import React, { useImperativeHandle, useRef, forwardRef, useState, useEffect } from 'react'

interface SmartTextareaProps {
  value?: string
  onChange?: (value: string) => void
  onBlur?: (value: string) => void
  onSave?: (value: string) => void
  placeholder?: string
  className?: string
  style?: React.CSSProperties
  hasSaveBtn?: boolean
}

export interface SmartTextareaRef {
  getValue: () => string
}

const SmartTextarea = forwardRef<SmartTextareaRef, SmartTextareaProps>(
  (
    {
      value = '',
      placeholder = 'Type here...',
      className = '',
      style = {},
      hasSaveBtn = true,
      onChange = noop,
      onBlur = noop,
      onSave = noop,
    },
    ref,
  ) => {
    const [text, setText] = useState(value)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useImperativeHandle(ref, () => ({
      getValue: () => text,
    }))

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        const textarea = textareaRef.current
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd

        // 插入 Tab 并更新光标位置
        const newValue = text.substring(0, start) + '\t' + text.substring(end)
        setText(newValue)
        onChange?.(newValue)

        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1
        }, 0)
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value)
      onChange?.(e.target.value)
    }

    const handleBlur = () => {
      onBlur?.(text)
    }

    const handleSave = () => {
      onSave(text)
    }

    // 监听 props.value 的变化
    useEffect(() => {
      if (value !== text) {
        setText(value)
      }
    }, [value])

    return (
      <div className="relative w-full" style={style}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full  h-full p-2 border rounded-md font-mono whitespace-pre-wrap outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        />

        {hasSaveBtn && (
          <button
            onClick={handleSave}
            className="absolute bottom-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
            disabled={!text.length}
          >
            Save
          </button>
        )}
      </div>
    )
  },
)

export default SmartTextarea
