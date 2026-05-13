import { useState } from 'react'
import { NoteList } from '../components/notes/NoteList'
import { NoteEditor } from '../components/notes/NoteEditor'
import { useNotes, type Note } from '../lib/queries/notes'
import { FileText } from 'lucide-react'

export function NotesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: notes } = useNotes()

  const selectedNote = notes?.find((n) => n.id === selectedId) || null

  const handleSelect = (note: Note) => {
    setSelectedId(note.id)
  }

  return (
    <div className="h-full flex">
      {/* Sidebar list */}
      <div className="w-72 flex-shrink-0 h-full">
        <NoteList selectedId={selectedId} onSelect={handleSelect} />
      </div>

      {/* Editor */}
      <div className="flex-1 h-full">
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
  )
}