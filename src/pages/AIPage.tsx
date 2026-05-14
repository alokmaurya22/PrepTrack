import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Sparkles,
  Bot,
  User,
  Send,
  Key,
  Trash2,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../lib/utils'
import { format } from 'date-fns'

// ─── Types ─────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

// ─── Constants ──────────────────────────────────────────────────────────────

const API_KEY_STORAGE = 'prep-openrouter-api-key'

const MODELS = [
  { value: 'google/gemini-flash-1.5',                label: 'Gemini Flash (Fast)' },
  { value: 'openai/gpt-4o-mini',                     label: 'GPT-4o Mini'         },
  { value: 'anthropic/claude-3-haiku',               label: 'Claude Haiku'        },
  { value: 'meta-llama/llama-3.1-8b-instruct:free',  label: 'Llama 3.1 (Free)'   },
] as const

const DEFAULT_MODEL = 'google/gemini-flash-1.5'

const SYSTEM_PROMPT = `You are PrepTrack AI, an intelligent exam preparation assistant. You help students prepare for competitive exams (UPSC CSE, GATE, CAT, JEE, NEET, SSC, and others). You can: answer subject-matter questions with precision, explain complex topics clearly with examples, help structure mains/descriptive answers, suggest study strategies and mnemonics, create practice questions, and provide quick revision notes. Be concise, accurate, and encouraging. Format responses with markdown when helpful (bullet points, bold for key terms).`

const QUICK_PROMPTS = [
  'Explain the concept of federalism',
  'Create 5 practice questions on [topic]',
  'How should I structure a mains answer?',
  'Summarize key points about [topic]',
]

// ─── Setup Screen ───────────────────────────────────────────────────────────

function SetupScreen({ onSave }: { onSave: (key: string) => void }) {
  const [keyInput, setKeyInput] = useState('')

  function handleSave() {
    const trimmed = keyInput.trim()
    if (!trimmed) {
      toast.error('Please enter your API key')
      return
    }
    onSave(trimmed)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSave()
  }

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-4 rounded-2xl bg-primary/10">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-foreground">AI Study Assistant</h1>
          <p className="text-sm text-muted-foreground">
            Connect to OpenRouter to get AI-powered exam prep help
          </p>
        </div>

        {/* Input card */}
        <div className="border border-border rounded-lg bg-card p-6 space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="api-key-input">
              OpenRouter API Key
            </label>
            <input
              id="api-key-input"
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="sk-or-..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Save &amp; Start Chatting
          </button>
        </div>

        {/* Helper text */}
        <p className="text-xs text-muted-foreground">
          Get your free API key at openrouter.ai&nbsp;&nbsp;
          <span
            role="link"
            tabIndex={0}
            onClick={() => window.open('https://openrouter.ai/keys', '_blank', 'noopener')}
            onKeyDown={(e) => e.key === 'Enter' && window.open('https://openrouter.ai/keys', '_blank', 'noopener')}
            className="text-primary cursor-pointer hover:underline focus:outline-none focus:underline"
          >
            Get API key →
          </span>
        </p>
      </div>
    </div>
  )
}

// ─── Message Bubble ─────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3 items-start', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary/15' : 'bg-muted'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary" />
        ) : (
          <Bot className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Bubble + timestamp */}
      <div className={cn('flex flex-col gap-1 max-w-[75%]', isUser && 'items-end')}>
        <div
          className={cn(
            'px-3 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap break-words',
            isUser
              ? 'bg-primary/10 text-primary rounded-tr-sm'
              : 'bg-muted text-foreground rounded-tl-sm'
          )}
        >
          {message.content}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {format(message.timestamp, 'h:mm a')}
        </span>
      </div>
    </div>
  )
}

// ─── Thinking Bubble ────────────────────────────────────────────────────────

function ThinkingBubble() {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-muted">
        <Bot className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="px-3 py-2.5 rounded-xl rounded-tl-sm bg-muted">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground animate-pulse">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          thinking…
        </span>
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ onQuickPrompt }: { onQuickPrompt: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
      <div className="text-center space-y-1.5">
        <Bot className="h-10 w-10 mx-auto text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">How can I help you today?</p>
        <p className="text-xs text-muted-foreground">
          Ask anything about your exam prep or pick a quick start below
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onQuickPrompt(prompt)}
            className="border border-border rounded-lg bg-card p-3 text-left text-sm text-foreground hover:bg-muted transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Model Selector ──────────────────────────────────────────────────────────

function ModelSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-md border border-input bg-background pl-2.5 pr-7 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
      >
        {MODELS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted-foreground" />
    </div>
  )
}

// ─── Chat Interface ───────────────────────────────────────────────────────────

function ChatInterface({ apiKey, onReset }: { apiKey: string; onReset: () => void }) {
  const [messages, setMessages]           = useState<Message[]>([])
  const [conversationHistory, setHistory] = useState<ConversationMessage[]>([])
  const [input, setInput]                 = useState('')
  const [isLoading, setIsLoading]         = useState(false)
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL)

  const bottomRef   = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Auto-resize textarea
  function autoResize() {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    const lineHeight = 20
    const maxRows = 4
    ta.style.height = Math.min(ta.scrollHeight, lineHeight * maxRows + 16) + 'px'
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    autoResize()
  }

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      }

      const newHistory: ConversationMessage[] = [
        ...conversationHistory,
        { role: 'user', content: trimmed },
      ]

      setMessages((prev) => [...prev, userMsg])
      setHistory(newHistory)
      setInput('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
      setIsLoading(true)

      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://preptrack.app',
            'X-Title': 'PrepTrack',
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...newHistory,
            ],
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        const assistantMessage: string = data.choices[0].message.content

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: assistantMessage,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMsg])
        setHistory((prev) => [...prev, { role: 'assistant', content: assistantMessage }])
      } catch {
        toast.error('API call failed. Check your API key.')
      } finally {
        setIsLoading(false)
      }
    },
    [apiKey, conversationHistory, isLoading, selectedModel]
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function handleSendClick() {
    sendMessage(input)
  }

  function handleQuickPrompt(text: string) {
    setInput(text)
    textareaRef.current?.focus()
    // Trigger resize after state updates
    requestAnimationFrame(() => autoResize())
  }

  function handleClear() {
    setMessages([])
    setHistory([])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const hasMessages = messages.length > 0

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <Bot className="h-4 w-4 text-primary flex-shrink-0" />
        <span className="text-sm font-semibold text-foreground flex-1">AI Assistant</span>

        <ModelSelector value={selectedModel} onChange={setSelectedModel} />

        {hasMessages && (
          <button
            onClick={handleClear}
            title="Clear conversation"
            className="flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}

        <button
          onClick={onReset}
          title="Change API key"
          className="rounded-md border border-input bg-background p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Key className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          <EmptyState onQuickPrompt={handleQuickPrompt} />
        ) : (
          <div className="p-4 space-y-4 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && <ThinkingBubble />}
            <div ref={bottomRef} />
          </div>
        )}
        {/* When empty state is showing but loading somehow, keep scroll anchor */}
        {!hasMessages && <div ref={bottomRef} />}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-border bg-card px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything… (Ctrl+Enter to send)"
            rows={1}
            disabled={isLoading}
            className={cn(
              'flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground',
              'disabled:opacity-50 leading-5 overflow-hidden'
            )}
            style={{ minHeight: '36px', maxHeight: '96px' }}
          />
          <button
            onClick={handleSendClick}
            disabled={isLoading || !input.trim()}
            title="Send (Ctrl+Enter)"
            className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex-shrink-0 flex items-center gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{isLoading ? 'Sending…' : 'Send'}</span>
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          Ctrl+Enter to send · Conversation is not saved
        </p>
      </div>
    </div>
  )
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function AIPage() {
  const [apiKey, setApiKey] = useState<string | null>(() => {
    return localStorage.getItem(API_KEY_STORAGE)
  })

  function handleSaveKey(key: string) {
    localStorage.setItem(API_KEY_STORAGE, key)
    setApiKey(key)
    toast.success('API key saved! Start chatting.')
  }

  function handleResetKey() {
    localStorage.removeItem(API_KEY_STORAGE)
    setApiKey(null)
    toast.info('API key removed.')
  }

  if (!apiKey) {
    return <SetupScreen onSave={handleSaveKey} />
  }

  return <ChatInterface apiKey={apiKey} onReset={handleResetKey} />
}
