import { useState, useEffect, useRef, useCallback } from 'react'
import { Save, Pin, PinOff, Tag, X } from 'lucide-react'
import { useUpdateNote, type Note } from '../../lib/queries/notes'
import { cn } from '../../lib/utils'

interface Props {
  note: Note
}

export function NoteEditor({ note }: Props) {
  const updateNote = useUpdateNote()
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content_md || '')
  const [tags, setTags] = useState<string[]>(note.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const noteIdRef = useRef(note.id)

  // Reset when note changes
  useEffect(() => {
    if (note.id !== noteIdRef.current) {
      noteIdRef.current = note.id
      setTitle(note.title)
      setContent(note.content_md || '')
      setTags(note.tags || [])
      setLastSaved(null)
    }
  }, [note])

  const save = useCallback(
    (data: { title?: string; content_md?: string; tags?: string[] }) => {
      setSaving(true)
      updateNote.mutate(
        { id: note.id, ...data },
        {
          onSuccess: () => {
            setSaving(false)
            setLastSaved(new Date())
          },
          onError: () => setSaving(false),
        }
      )
    },
    [note.id, updateNote]
  )

  // Auto-save after 2 seconds of inactivity
  const debouncedSave = useCallback(
    (field: string, value: string | string[]) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        save({ [field]: value })
      }, 2000)
    },
    [save]
  )

  const handleTitleChange = (val: string) => {
    setTitle(val)
    debouncedSave('title', val)
  }

  const handleContentChange = (val: string) => {
    setContent(val)
    debouncedSave('content_md', val)
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      const newTags = [...tags, tag]
      setTags(newTags)
      setTagInput('')
      save({ tags: newTags })
    }
  }

  const removeTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag)
    setTags(newTags)
    save({ tags: newTags })
  }

  const togglePin = () => {
    updateNote.mutate({ id: note.id, is_pinned: !note.is_pinned })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePin}
            className={cn(
              'p-1 rounded hover:bg-muted transition-colors',
              note.is_pinned ? 'text-amber-500' : 'text-muted-foreground'
            )}
            title={note.is_pinned ? 'Unpin' : 'Pin'}
          >
            {note.is_pinned ? <Pin className="h-4 w-4 fill-current" /> : <PinOff className="h-4 w-4" />}
          </button>
          <span className="text-xs text-muted-foreground">
            {saving ? (
              <span className="flex items-center gap-1">
                <Save className="h-3 w-3 animate-pulse" />
                Saving…
              </span>
            ) : lastSaved ? (
              `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            ) : (
              'Auto-save on'
            )}
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="px-4 pt-4">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Note title…"
          className="w-full text-xl font-bold text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Tags */}
      <div className="px-4 py-2 flex items-center gap-1.5 flex-wrap">
        <Tag className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
          >
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add tag…"
          className="text-xs bg-transparent border-none outline-none text-muted-foreground placeholder:text-muted-foreground/50 w-20"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start writing… (Markdown supported)"
          className="w-full h-full px-4 py-3 text-sm text-foreground bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/50 leading-relaxed font-mono"
        />
      </div>
    </div>
  )
}