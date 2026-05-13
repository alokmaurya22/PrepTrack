import { useState } from 'react'
import { Plus, Layers } from 'lucide-react'
import { useAllKeyNotes, useDeleteKeyNote, type KeyNote } from '../lib/queries/keyNotes'
import { ReviewSession } from '../components/key-notes/ReviewSession'
import { KeyNoteForm } from '../components/key-notes/KeyNoteForm'
import { cn } from '../lib/utils'

export function KeyNotesPage() {
  const { data: allNotes, isLoading } = useAllKeyNotes()
  const deleteKeyNote = useDeleteKeyNote()
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState<'review' | 'library'>('review')

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading flashcards…</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setView('review')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                view === 'review'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Review
            </button>
            <button
              onClick={() => setView('library')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                view === 'library'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Library ({allNotes?.length || 0})
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Card
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {view === 'review' ? (
          <ReviewSession />
        ) : (
          <div className="p-4">
            {allNotes && allNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Layers className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-foreground">No flashcards yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first flashcard to start reviewing.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {allNotes?.map((note: KeyNote) => (
                  <div
                    key={note.id}
                    className="border border-border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors"
                  >
                    <p className="text-sm font-medium text-foreground mb-2">{note.front_text}</p>
                    <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{note.back_text}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        Reps: {note.repetitions} · EF: {note.ease_factor.toFixed(1)}
                      </span>
                      <button
                        onClick={() => deleteKeyNote.mutate(note.id)}
                        className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && <KeyNoteForm onClose={() => setShowForm(false)} />}
    </div>
  )
}