import { useState } from 'react'
import { Plus, Layers, RotateCcw, Trash2 } from 'lucide-react'
import { useAllKeyNotes, useDeleteKeyNote, type KeyNote } from '../lib/queries/keyNotes'
import { ReviewSession } from '../components/key-notes/ReviewSession'
import { KeyNoteForm } from '../components/key-notes/KeyNoteForm'
import { cn } from '../lib/utils'

const CARD_GRADIENTS = [
  'from-violet-400 to-purple-500',
  'from-blue-400 to-indigo-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-pink-400 to-rose-500',
  'from-cyan-400 to-blue-500',
]

function LibraryCard({ note, index, onDelete }: { note: KeyNote; index: number; onDelete: () => void }) {
  const [flipped, setFlipped] = useState(false)
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length]

  return (
    <div style={{ perspective: '1200px' }}>
      <div
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s cubic-bezier(0.4,0.2,0.2,1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          position: 'relative',
          height: '180px',
        }}
      >
        {/* Front face */}
        <div
          style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0 }}
          className={cn(
            'rounded-xl bg-gradient-to-br shadow-md flex flex-col justify-between p-4 group',
            gradient
          )}
        >
          {/* Delete button — top-right, visible on hover */}
          <div className="flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-black/20 hover:bg-red-500/80 p-1.5 text-white"
              title="Delete card"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Question text */}
          <p className="text-sm font-bold text-white leading-snug line-clamp-3 flex-1 flex items-center">
            {note.front_text}
          </p>

          {/* Bottom row */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-white/50">Reps: {note.repetitions}</span>
            <button
              onClick={() => setFlipped(true)}
              className="flex items-center gap-1 text-[10px] text-white/70 hover:text-white transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              flip
            </button>
          </div>
        </div>

        {/* Back face */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            position: 'absolute',
            inset: 0,
          }}
          className="rounded-xl bg-white dark:bg-neutral-900 border border-border shadow-md flex flex-col justify-between p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Answer
          </p>
          <p className="text-sm text-foreground leading-snug line-clamp-4 flex-1 flex items-center">
            {note.back_text}
          </p>
          <div className="flex justify-end mt-2">
            <button
              onClick={() => setFlipped(false)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              flip back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {allNotes?.map((note: KeyNote, index: number) => (
                  <LibraryCard
                    key={note.id}
                    note={note}
                    index={index}
                    onDelete={() => deleteKeyNote.mutate(note.id)}
                  />
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
