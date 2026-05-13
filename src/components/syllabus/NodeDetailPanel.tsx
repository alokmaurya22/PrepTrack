import { useState } from 'react'
import { X, Trash2, ExternalLink, BookOpen, Video, Link2, FileText } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { ConfidenceStars } from './ConfidenceStars'
import type { SyllabusNode, UserProgress } from '../../lib/queries/syllabus'
import { useNodeSources, useAddNodeSource, useDeleteNodeSource, useUpdateProgress } from '../../lib/queries/syllabus'

interface Props {
  node: SyllabusNode
  progress: UserProgress | undefined
  onClose: () => void
}

const SOURCE_TYPE_ICONS: Record<string, React.ReactNode> = {
  book: <BookOpen className="h-3.5 w-3.5" />,
  video: <Video className="h-3.5 w-3.5" />,
  url: <Link2 className="h-3.5 w-3.5" />,
  other: <FileText className="h-3.5 w-3.5" />,
}

export function NodeDetailPanel({ node, progress, onClose }: Props) {
  const { data: sources, isLoading: sourcesLoading } = useNodeSources(node.id)
  const addSource = useAddNodeSource()
  const deleteSource = useDeleteNodeSource()
  const updateProgress = useUpdateProgress()

  const [showAddSource, setShowAddSource] = useState(false)
  const [newSource, setNewSource] = useState({ type: 'book', title: '', url: '', notes: '' })

  const handleAddSource = () => {
    if (!newSource.title.trim()) return
    addSource.mutate(
      {
        syllabus_node_id: node.id,
        type: newSource.type,
        title: newSource.title,
        url: newSource.url || undefined,
        notes: newSource.notes || undefined,
      },
      {
        onSuccess: () => {
          setShowAddSource(false)
          setNewSource({ type: 'book', title: '', url: '', notes: '' })
        },
      }
    )
  }

  const handleConfidenceChange = (rating: number) => {
    updateProgress.mutate({
      nodeId: node.id,
      status: progress?.status || 'not_started',
      confidence: rating,
    })
  }

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground truncate">{node.title}</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Status */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
          <StatusBadge status={progress?.status || 'not_started'} />
        </div>

        {/* Confidence */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Confidence</label>
          <ConfidenceStars
            rating={progress?.confidence_rating ?? null}
            onChange={handleConfidenceChange}
            size="md"
          />
        </div>

        {/* Hours */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hours</label>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-muted rounded-md p-2 text-center">
              <div className="text-lg font-bold text-foreground">{progress?.hours_spent ?? 0}</div>
              <div className="text-[10px] text-muted-foreground">Spent</div>
            </div>
            <div className="bg-muted rounded-md p-2 text-center">
              <div className="text-lg font-bold text-foreground">
                {progress?.hours_estimated_override ?? node.default_hours}
              </div>
              <div className="text-[10px] text-muted-foreground">Estimated</div>
            </div>
          </div>
        </div>

        {/* Description */}
        {node.description && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
            <p className="text-sm text-muted-foreground leading-relaxed">{node.description}</p>
          </div>
        )}

        {/* Sources */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sources</label>
            <button
              onClick={() => setShowAddSource(!showAddSource)}
              className="text-xs text-primary hover:underline"
            >
              + Add
            </button>
          </div>

          {showAddSource && (
            <div className="space-y-2 bg-muted/50 rounded-md p-3">
              <select
                value={newSource.type}
                onChange={(e) => setNewSource((s) => ({ ...s, type: e.target.value }))}
                className="w-full text-xs border border-border rounded px-2 py-1 bg-background"
              >
                <option value="book">Book</option>
                <option value="video">Video</option>
                <option value="url">URL</option>
                <option value="other">Other</option>
              </select>
              <input
                type="text"
                placeholder="Title"
                value={newSource.title}
                onChange={(e) => setNewSource((s) => ({ ...s, title: e.target.value }))}
                className="w-full text-xs border border-border rounded px-2 py-1 bg-background"
              />
              <input
                type="text"
                placeholder="URL (optional)"
                value={newSource.url}
                onChange={(e) => setNewSource((s) => ({ ...s, url: e.target.value }))}
                className="w-full text-xs border border-border rounded px-2 py-1 bg-background"
              />
              <textarea
                placeholder="Notes (optional)"
                value={newSource.notes}
                onChange={(e) => setNewSource((s) => ({ ...s, notes: e.target.value }))}
                rows={2}
                className="w-full text-xs border border-border rounded px-2 py-1 bg-background resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddSource}
                  disabled={addSource.isPending}
                  className="flex-1 text-xs bg-primary text-primary-foreground rounded px-2 py-1.5 font-medium disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowAddSource(false)}
                  className="text-xs border border-border rounded px-2 py-1.5 text-muted-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {sourcesLoading && (
            <p className="text-xs text-muted-foreground">Loading sources…</p>
          )}

          {sources && sources.length === 0 && !sourcesLoading && (
            <p className="text-xs text-muted-foreground">No sources added yet.</p>
          )}

          {sources && sources.length > 0 && (
            <div className="space-y-1">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-start gap-2 p-2 rounded-md bg-muted/30 group"
                >
                  <span className="mt-0.5 text-muted-foreground">
                    {SOURCE_TYPE_ICONS[source.type] || SOURCE_TYPE_ICONS.other}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      {source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-foreground hover:text-primary truncate flex items-center gap-1"
                        >
                          {source.title}
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-xs font-medium text-foreground truncate">{source.title}</span>
                      )}
                    </div>
                    {source.notes && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{source.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteSource.mutate({ sourceId: source.id, nodeId: node.id })}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity flex-shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}