import { useState } from 'react'
import { Search, Plus, Trash2, Pin } from 'lucide-react'
import { useNotes, useCreateNote, useDeleteNote, useSearchNotes, type Note } from '../../lib/queries/notes'
import { cn } from '../../lib/utils'
import { format } from 'date-fns'

interface Props {
  selectedId: string | null
  onSelect: (note: Note) => void
}

export function NoteList({ selectedId, onSelect }: Props) {
  const { data: notes, isLoading } = useNotes()
  const createNote = useCreateNote()
  const deleteNote = useDeleteNote()
  const [searchQuery, setSearchQuery] = useState('')
  const { data: searchResults } = useSearchNotes(searchQuery)

  const displayedNotes = searchQuery ? searchResults : notes

  const handleCreate = () => {
    createNote.mutate({}, {
      onSuccess: (newNote) => {
        onSelect(newNote)
      },
    })
  }

  const getPreview = (note: Note) => {
    const text = note.content_md || ''
    return text.substring(0, 80) + (text.length > 80 ? '…' : '')
  }

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return format(date, 'MMM d')
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-xs text-muted-foreground animate-pulse">
        Loading notes…
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col border-r border-border bg-card/30">
      {/* Header */}
      <div className="p-3 space-y-2 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Notes</h2>
          <button
            onClick={handleCreate}
            disabled={createNote.isPending}
            className="flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Plus className="h-3 w-3" />
            New
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notes…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2 py-1.5 text-xs border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Note list */}
      <div className="flex-1 overflow-y-auto">
        {displayedNotes && displayedNotes.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No notes match your search' : 'No notes yet'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery ? 'Try a different search term' : 'Click "New" to create your first note'}
            </p>
          </div>
        )}

        {displayedNotes?.map((note) => (
          <div
            key={note.id}
            onClick={() => onSelect(note)}
            className={cn(
              'group px-3 py-2.5 border-b border-border/50 cursor-pointer transition-colors hover:bg-muted/50',
              note.id === selectedId && 'bg-primary/5 border-l-2 border-l-primary'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {note.is_pinned && <Pin className="h-3 w-3 text-amber-500 fill-current flex-shrink-0" />}
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {note.title || 'Untitled Note'}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {getPreview(note)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    {getTimeAgo(note.updated_at)}
                  </span>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex gap-1">
                      {note.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-[10px] px-1 py-px rounded bg-muted text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                      {note.tags.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">+{note.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteNote.mutate(note.id)
                }}
                className="sm:opacity-0 sm:group-hover:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}