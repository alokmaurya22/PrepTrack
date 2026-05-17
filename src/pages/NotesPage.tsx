import { useState } from 'react'
import { NoteList } from '../components/notes/NoteList'
import { NoteEditor } from '../components/notes/NoteEditor'
import { useNotes, type Note } from '../lib/queries/notes'
import { FileText, ChevronLeft } from 'lucide-react'

export function NotesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobilePane, setMobilePane] = useState<'list' | 'editor'>('list')
  const { data: notes } = useNotes()

  const selectedNote = notes?.find((n) => n.id === selectedId) || null

  const handleSelect = (note: Note) => {
    setSelectedId(note.id)
    setMobilePane('editor')
  }

  return (
    <div className="h-full flex">
      {/* Sidebar list — full width on mobile when showing list, hidden when showing editor */}
      <div className={
        mobilePane === 'editor'
          ? 'hidden md:flex md:w-72 flex-shrink-0 h-full'
          : 'w-full md:w-72 flex-shrink-0 h-full'
      }>
        <NoteList selectedId={selectedId} onSelect={handleSelect} />
      </div>

      {/* Editor — hidden on mobile when list is shown */}
      <div className={
        mobilePane === 'list'
          ? 'hidden md:flex flex-1 h-full flex-col'
          : 'flex flex-1 h-full flex-col'
      }>
        {/* Back button — mobile only */}
        <div className="md:hidden flex items-center gap-1 px-3 py-2 border-b border-border flex-shrink-0">
          <button
            onClick={() => setMobilePane('list')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> All Notes
          </button>
        </div>

        <div className="flex-1 min-h-0">
          {selectedNote ? (
            <NoteEditor key={selectedNote.id} note={selectedNote} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <FileText className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Select a note or create a new one</p>
              <p className="text-xs mt-1 opacity-70">Your notes are auto-saved</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
