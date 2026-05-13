import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

interface StepProps {
  data: Record<string, unknown>
  onUpdate: (d: Record<string, unknown>) => void
}

interface LanguageItem {
  id: number
  name: string
}

const FALLBACK_LANGUAGES: LanguageItem[] = [
  { id: 23, name: 'English' },
  { id: 6, name: 'Hindi' },
  { id: 1, name: 'Assamese' },
  { id: 2, name: 'Bengali' },
  { id: 3, name: 'Bodo' },
  { id: 4, name: 'Dogri' },
  { id: 5, name: 'Gujarati' },
  { id: 7, name: 'Kannada' },
  { id: 8, name: 'Kashmiri' },
  { id: 9, name: 'Konkani' },
  { id: 10, name: 'Maithili' },
  { id: 11, name: 'Malayalam' },
  { id: 12, name: 'Manipuri' },
  { id: 13, name: 'Marathi' },
  { id: 14, name: 'Nepali' },
  { id: 15, name: 'Odia' },
  { id: 16, name: 'Punjabi' },
  { id: 17, name: 'Sanskrit' },
  { id: 18, name: 'Santhali' },
  { id: 19, name: 'Sindhi' },
  { id: 20, name: 'Tamil' },
  { id: 21, name: 'Telugu' },
  { id: 22, name: 'Urdu' },
]

export function ExamMediumStep({ data, onUpdate }: StepProps) {
  const [languages, setLanguages] = useState<LanguageItem[]>([])
  const [search, setSearch] = useState('')
  const currentId = data.examMediumId as number || 0

  useEffect(() => {
    async function fetchLanguages() {
      const { data: dbLangs, error } = await supabase
        .from('exam_languages')
        .select('id, name')
        .order('name')
      if (!error && dbLangs && dbLangs.length > 0) {
        setLanguages(dbLangs as LanguageItem[])
      } else {
        setLanguages(FALLBACK_LANGUAGES)
      }
    }
    fetchLanguages()
  }, [])

  const filtered = languages.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Select your Exam Medium</h2>
        <p className="text-muted-foreground text-sm mt-1">
          The language you'll write your Mains answers in. All 22 scheduled languages + English available.
        </p>
      </div>
      <div className="relative">
        <input
          type="text"
          placeholder="Search languages…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-2"
        />
      </div>
      <div className="max-h-64 overflow-y-auto border border-border rounded-md divide-y divide-border">
        {filtered.map(lang => (
          <button
            key={lang.id}
            onClick={() => onUpdate({ examMediumId: lang.id, examMediumName: lang.name })}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
              currentId === lang.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            {lang.name}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">No languages found</p>
        )}
      </div>
    </div>
  )
}