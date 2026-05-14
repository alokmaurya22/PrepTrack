import { useState } from 'react'
import { Plus, Search, Trash2, ExternalLink, Calendar, X } from 'lucide-react'
import { useCAEntries, useCreateCAEntry, useDeleteCAEntry, type CAEntry } from '../lib/queries/currentAffairs'
import { format } from 'date-fns'

export function CurrentAffairsPage() {
  const currentMonth = format(new Date(), 'yyyy-MM')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const { data: entries, isLoading } = useCAEntries(selectedMonth)
  const createEntry = useCreateCAEntry()
  const deleteEntry = useDeleteCAEntry()
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)

  const [sourceFilter, setSourceFilter] = useState('all')

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [sourceName, setSourceName] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [summary, setSummary] = useState('')
  const [tags, setTags] = useState('')
  const [tagList, setTagList] = useState<string[]>([])

  const allSources = ['all', ...Array.from(new Set((entries || []).map((e) => e.source_name).filter(Boolean) as string[]))]

  const filtered = entries?.filter((e) => {
    if (sourceFilter !== 'all' && e.source_name !== sourceFilter) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      e.title.toLowerCase().includes(q) ||
      (e.summary && e.summary.toLowerCase().includes(q)) ||
      e.tags?.some((t) => t.toLowerCase().includes(q))
    )
  })

  const groupedByDate = filtered?.reduce(
    (acc, entry) => {
      const d = entry.date
      if (!acc[d]) acc[d] = []
      acc[d].push(entry)
      return acc
    },
    {} as Record<string, CAEntry[]>
  )

  const addTag = () => {
    const t = tags.trim().toLowerCase()
    if (t && !tagList.includes(t)) {
      setTagList([...tagList, t])
      setTags('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    createEntry.mutate(
      {
        date,
        title: title.trim(),
        source_name: sourceName || undefined,
        source_url: sourceUrl || undefined,
        summary: summary || undefined,
        tags: tagList,
      },
      {
        onSuccess: () => {
          setShowForm(false)
          setTitle('')
          setSourceName('')
          setSourceUrl('')
          setSummary('')
          setTagList([])
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading current affairs…</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">Current Affairs</h2>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search entries…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 pl-7 pr-2 py-1.5 text-xs border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs border border-border rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {allSources.length > 1 && (
            <div className="flex gap-1 flex-wrap">
              {allSources.map((src) => (
                <button
                  key={src}
                  onClick={() => setSourceFilter(src)}
                  className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                    sourceFilter === src
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  {src === 'all' ? 'All Sources' : src}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Entry
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {entries && entries.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No current affairs entries for this month</p>
            <p className="text-xs text-muted-foreground mt-1">Start logging daily news to track here</p>
          </div>
        ) : groupedByDate && Object.keys(groupedByDate).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No entries match your search</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByDate &&
              Object.entries(groupedByDate)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([dateStr, dayEntries]) => (
                  <div key={dateStr}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 sticky top-0 bg-background py-1">
                      {format(new Date(dateStr), 'EEEE, MMMM d, yyyy')}
                    </h3>
                    <div className="space-y-2">
                      {dayEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="border border-border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-medium text-foreground">{entry.title}</h4>
                                {entry.source_name && (
                                  <span className="text-[10px] px-1.5 py-px rounded-full bg-muted text-muted-foreground font-medium flex-shrink-0">
                                    {entry.source_name}
                                  </span>
                                )}
                                {entry.source_url && (
                                  <a
                                    href={entry.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline flex-shrink-0"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                )}
                              </div>
                              {entry.summary && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{entry.summary}</p>
                              )}
                              {entry.tags && entry.tags.length > 0 && (
                                <div className="flex gap-1 mt-1.5">
                                  {entry.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-[10px] px-1.5 py-px rounded-full bg-primary/10 text-primary"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => deleteEntry.mutate(entry.id)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity flex-shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">New CA Entry</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Entry title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="text"
                  placeholder="Source name (e.g. The Hindu)"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <input
                type="url"
                placeholder="Source URL (optional)"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <textarea
                placeholder="Summary (optional)"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Tags</label>
                <div className="flex gap-1 flex-wrap mb-2">
                  {tagList.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
                    >
                      {tag}
                      <button type="button" onClick={() => setTagList(tagList.filter((t) => t !== tag))}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add tag…"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                    className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={createEntry.isPending || !title.trim()}
                  className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {createEntry.isPending ? 'Saving…' : 'Save Entry'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}