import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

interface StepProps {
  data: Record<string, unknown>
  onUpdate: (d: Record<string, unknown>) => void
}

interface SubjectItem {
  id: number
  name: string
}

const FALLBACK_SUBJECTS: SubjectItem[] = [
  { id: 1, name: 'Agriculture' },
  { id: 2, name: 'Animal Husbandry & Veterinary Science' },
  { id: 3, name: 'Anthropology' },
  { id: 4, name: 'Botany' },
  { id: 5, name: 'Chemistry' },
  { id: 6, name: 'Civil Engineering' },
  { id: 7, name: 'Commerce & Accountancy' },
  { id: 8, name: 'Economics' },
  { id: 9, name: 'Electrical Engineering' },
  { id: 10, name: 'Geography' },
  { id: 11, name: 'Geology' },
  { id: 12, name: 'History' },
  { id: 13, name: 'Law' },
  { id: 14, name: 'Management' },
  { id: 15, name: 'Mathematics' },
  { id: 16, name: 'Mechanical Engineering' },
  { id: 17, name: 'Medical Science' },
  { id: 18, name: 'Philosophy' },
  { id: 19, name: 'Physics' },
  { id: 20, name: 'Political Science & International Relations' },
  { id: 21, name: 'Psychology' },
  { id: 22, name: 'Public Administration' },
  { id: 23, name: 'Sociology' },
  { id: 24, name: 'Statistics' },
  { id: 25, name: 'Zoology' },
  { id: 26, name: 'Assamese Literature' },
  { id: 27, name: 'Bengali Literature' },
  { id: 28, name: 'Bodo Literature' },
  { id: 29, name: 'Dogri Literature' },
  { id: 30, name: 'English Literature' },
  { id: 31, name: 'Gujarati Literature' },
  { id: 32, name: 'Hindi Literature' },
  { id: 33, name: 'Kannada Literature' },
  { id: 34, name: 'Kashmiri Literature' },
  { id: 35, name: 'Konkani Literature' },
  { id: 36, name: 'Maithili Literature' },
  { id: 37, name: 'Malayalam Literature' },
  { id: 38, name: 'Manipuri Literature' },
  { id: 39, name: 'Marathi Literature' },
  { id: 40, name: 'Nepali Literature' },
  { id: 41, name: 'Odia Literature' },
  { id: 42, name: 'Punjabi Literature' },
  { id: 43, name: 'Sanskrit Literature' },
  { id: 44, name: 'Santhali Literature' },
  { id: 45, name: 'Sindhi Literature' },
  { id: 46, name: 'Tamil Literature' },
  { id: 47, name: 'Telugu Literature' },
  { id: 48, name: 'Urdu Literature' },
]

export function OptionalSubjectStep({ data, onUpdate }: StepProps) {
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [search, setSearch] = useState('')
  const currentId = data.optionalSubjectId as number || 0

  useEffect(() => {
    async function fetchSubjects() {
      const { data: dbSubjects, error } = await supabase
        .from('optional_subjects')
        .select('id, name')
        .order('name')
      if (!error && dbSubjects && dbSubjects.length > 0) {
        setSubjects(dbSubjects as SubjectItem[])
      } else {
        setSubjects(FALLBACK_SUBJECTS)
      }
    }
    fetchSubjects()
  }, [])

  const filtered = subjects.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Choose your Optional Subject</h2>
        <p className="text-muted-foreground text-sm mt-1">
          This is for Mains Paper VI & VII. Choose from all 48 UPSC optionals.
        </p>
      </div>
      <div className="relative">
        <input
          type="text"
          placeholder="Search optional subjects…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-2"
        />
      </div>
      <div className="max-h-64 overflow-y-auto border border-border rounded-md divide-y divide-border">
        {filtered.map(subject => (
          <button
            key={subject.id}
            onClick={() => onUpdate({ optionalSubjectId: subject.id, optionalSubjectName: subject.name })}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
              currentId === subject.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            {subject.name}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">No subjects found</p>
        )}
      </div>
    </div>
  )
}