import { useState } from 'react'
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen } from 'lucide-react'
import { cn } from '../../lib/utils'
import { StatusBadge } from './StatusBadge'
import { ConfidenceStars } from './ConfidenceStars'
import type { SyllabusNode, UserProgress } from '../../lib/queries/syllabus'
import { useUpdateProgress } from '../../lib/queries/syllabus'

interface Props {
  node: SyllabusNode
  children: SyllabusNode[]
  progress: UserProgress | undefined
  completionPct: number
  depth: number
  onSelect: (node: SyllabusNode) => void
  selectedId: string | null
}

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'needs_revision', label: 'Needs Revision' },
]

export function SyllabusNodeRow({
  node,
  children,
  progress,
  completionPct,
  depth,
  onSelect,
  selectedId,
}: Props) {
  const [expanded, setExpanded] = useState(depth < 2)
  const updateProgress = useUpdateProgress()
  const hasChildren = children.length > 0
  const isSelected = node.id === selectedId
  const status = progress?.status || 'not_started'

  const handleStatusChange = (newStatus: string) => {
    updateProgress.mutate({ nodeId: node.id, status: newStatus })
  }

  const handleConfidenceChange = (rating: number) => {
    updateProgress.mutate({ nodeId: node.id, status, confidence: rating })
  }

  return (
    <div>
      {/* Row */}
      <div
        onClick={() => {
          if (hasChildren) setExpanded(!expanded)
          onSelect(node)
        }}
        className={cn(
          'flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors border-b border-border/50 hover:bg-muted/50',
          isSelected && 'bg-primary/5 border-l-2 border-l-primary',
          depth === 0 && 'bg-muted/30 font-semibold',
          depth === 1 && 'font-medium',
        )}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        {/* Expand/collapse */}
        <span className="w-5 flex-shrink-0 flex justify-center">
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <FileText className="h-3.5 w-3.5 text-muted-foreground/50" />
          )}
        </span>

        {/* Icon */}
        <span className="flex-shrink-0">
          {hasChildren ? (
            expanded ? (
              <FolderOpen className="h-4 w-4 text-amber-500/70" />
            ) : (
              <Folder className="h-4 w-4 text-amber-500/70" />
            )
          ) : (
            <FileText className="h-3.5 w-3.5 text-muted-foreground/40" />
          )}
        </span>

        {/* Title */}
        <span className="flex-1 text-sm text-foreground truncate">{node.title}</span>

        {/* Completion % for parents */}
        {hasChildren && completionPct > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {completionPct}%
          </span>
        )}

        {/* Confidence stars for leaves */}
        {node.is_leaf && (
          <ConfidenceStars
            rating={progress?.confidence_rating ?? null}
            onChange={handleConfidenceChange}
            size="sm"
          />
        )}

        {/* Status badge */}
        <StatusBadge status={status} size="xs" />

        {/* Status dropdown for leaves */}
        {node.is_leaf && (
          <select
            value={status}
            onChange={(e) => {
              e.stopPropagation()
              handleStatusChange(e.target.value)
            }}
            onClick={(e) => e.stopPropagation()}
            className="text-xs border border-border rounded px-1.5 py-0.5 bg-background text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {children.map((child) => (
            <SyllabusNodeRow
              key={child.id}
              node={child}
              children={[]}
              progress={undefined}
              completionPct={0}
              depth={depth + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  )
}