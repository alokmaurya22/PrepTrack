import { useState } from 'react'
import { X } from 'lucide-react'
import { useCreateKeyNote } from '../../lib/queries/keyNotes'

interface Props {
  onClose: () => void
}

export function KeyNoteForm({ onClose }: Props) {
  const createKeyNote = useCreateKeyNote()
  const [frontText, setFrontText] = useState('')
  const [backText, setBackText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!frontText.trim() || !backText.trim()) return
    createKeyNote.mutate(
      { front_text: frontText.trim(), back_text: backText.trim() },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">New Flashcard</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Front (Question)</label>
            <textarea
              value={frontText}
              onChange={(e) => setFrontText(e.target.value)}
              placeholder="What is the question or prompt?"
              rows={3}
              autoFocus
              className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Back (Answer)</label>
            <textarea
              value={backText}
              onChange={(e) => setBackText(e.target.value)}
              placeholder="The answer or explanation…"
              rows={4}
              className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={createKeyNote.isPending || !frontText.trim() || !backText.trim()}
              className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {createKeyNote.isPending ? 'Creating…' : 'Create Flashcard'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}