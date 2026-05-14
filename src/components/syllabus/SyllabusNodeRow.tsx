import { useState } from 'react'
import { ChevronRight, ChevronDown, FileText, Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import { cn } from '../../lib/utils'
import { StatusBadge } from './StatusBadge'
import { ConfidenceStars } from './ConfidenceStars'
import type { SyllabusNode, UserProgress } from '../../lib/queries/syllabus'
import { useUpdateProgress } from '../../lib/queries/syllabus'

interface Props {
  node: SyllabusNode
  allNodes: SyllabusNode[]
  progress: UserProgress | undefined
  completionPct: number
  depth: number
  onSelect: (node: SyllabusNode) => void
  selectedId: string | null
  getProgress: (id: string) => UserProgress | undefined
  getCompletion: (id: string) => number
  onEdit: (node: SyllabusNode) => void
  onDelete: (node: SyllabusNode) => void
  onAddChild: (parent: SyllabusNode) => void
}

const SUBJECT_COLORS = [
  { border: 'border-l-violet-500', bg: 'from-violet-500/10', icon: 'text-violet-600 dark:text-violet-400', badge: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' },
  { border: 'border-l-blue-500',   bg: 'from-blue-500/10',   icon: 'text-blue-600 dark:text-blue-400',     badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'     },
  { border: 'border-l-emerald-500',bg: 'from-emerald-500/10',icon: 'text-emerald-600 dark:text-emerald-400',badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'},
  { border: 'border-l-amber-500',  bg: 'from-amber-500/10',  icon: 'text-amber-600 dark:text-amber-400',   badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'   },
  { border: 'border-l-rose-500',   bg: 'from-rose-500/10',   icon: 'text-rose-600 dark:text-rose-400',     badge: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'       },
  { border: 'border-l-indigo-500', bg: 'from-indigo-500/10', icon: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'},
  { border: 'border-l-orange-500', bg: 'from-orange-500/10', icon: 'text-orange-600 dark:text-orange-400', badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'},
  { border: 'border-l-teal-500',   bg: 'from-teal-500/10',   icon: 'text-teal-600 dark:text-teal-400',     badge: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'       },
]

function colorForId(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length]
}

const STATUS_OPTIONS = [
  { value: 'not_started',    label: 'Not Started'    },
  { value: 'in_progress',    label: 'In Progress'    },
  { value: 'completed',      label: 'Completed'      },
  { value: 'needs_revision', label: 'Needs Revision' },
]

export function SyllabusNodeRow({
  node,
  allNodes,
  progress,
  completionPct,
  depth,
  onSelect,
  selectedId,
  getProgress,
  getCompletion,
  onEdit,
  onDelete,
  onAddChild,
}: Props) {
  const [expanded, setExpanded] = useState(depth < 2)
  const updateProgress = useUpdateProgress()

  const children = allNodes
    .filter((n) => n.parent_id === node.id)
    .sort((a, b) => a.sort_order - b.sort_order)

  const hasChildren = children.length > 0
  const isSelected = node.id === selectedId
  const status = progress?.status || 'not_started'

  const handleStatusChange = (newStatus: string) => {
    updateProgress.mutate({ nodeId: node.id, status: newStatus })
  }
  const handleConfidenceChange = (rating: number) => {
    updateProgress.mutate({ nodeId: node.id, status, confidence: rating })
  }

  // ── Subject card (depth 0) ──────────────────────────────────────────────
  if (depth === 0) {
    const color = colorForId(node.id)
    const leafCount = allNodes.filter(
      (n) => n.is_leaf && getAncestorIds(n, allNodes).includes(node.id)
    ).length
    const doneCount = allNodes.filter(
      (n) =>
        n.is_leaf &&
        getAncestorIds(n, allNodes).includes(node.id) &&
        getProgress(n.id)?.status === 'completed'
    ).length

    return (
      <div className="mb-3">
        {/* Subject header */}
        <div
          className={cn(
            'group flex items-center gap-3 px-4 py-3 cursor-pointer select-none',
            'bg-gradient-to-r to-transparent border-l-4 rounded-r-lg',
            color.border, color.bg,
            isSelected && 'ring-1 ring-inset ring-primary/30',
          )}
          onClick={() => {
            setExpanded(!expanded)
            onSelect(node)
          }}
        >
          {/* Chevron */}
          <span className="flex-shrink-0 text-muted-foreground">
            {expanded
              ? <ChevronDown className="h-4 w-4" />
              : <ChevronRight className="h-4 w-4" />}
          </span>

          {/* Icon */}
          <BookOpen className={cn('h-5 w-5 flex-shrink-0', color.icon)} />

          {/* Title */}
          <span className="flex-1 font-bold text-foreground text-sm md:text-base truncate">
            {node.title}
          </span>

          {/* Stage badge */}
          {node.stage && (
            <span className={cn('hidden sm:inline text-xs font-medium px-2 py-0.5 rounded-full', color.badge)}>
              {node.stage}
            </span>
          )}

          {/* Topic count + completion */}
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {doneCount}/{leafCount} topics
          </span>

          {leafCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full', color.border.replace('border-l-', 'bg-'))}
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-muted-foreground tabular-nums w-8 text-right">
                {completionPct}%
              </span>
            </div>
          )}

          {/* Actions */}
          <span
            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              title="Add topic"
              onClick={() => onAddChild(node)}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              title="Edit subject"
              onClick={() => onEdit(node)}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              title="Delete subject"
              onClick={() => onDelete(node)}
              className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </span>
        </div>

        {/* Topics list */}
        {expanded && (
          <div className="ml-4 border-l-2 border-border/40 mt-0.5">
            {children.length === 0 ? (
              <div className="py-3 pl-4 text-xs text-muted-foreground italic">
                No topics yet —{' '}
                <button
                  onClick={() => onAddChild(node)}
                  className="text-primary hover:underline"
                >
                  add one
                </button>
              </div>
            ) : (
              children.map((child) => (
                <SyllabusNodeRow
                  key={child.id}
                  node={child}
                  allNodes={allNodes}
                  progress={getProgress(child.id)}
                  completionPct={getCompletion(child.id)}
                  depth={1}
                  onSelect={onSelect}
                  selectedId={selectedId}
                  getProgress={getProgress}
                  getCompletion={getCompletion}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAddChild={onAddChild}
                />
              ))
            )}
          </div>
        )}
      </div>
    )
  }

  // ── Topic / Sub-topic row (depth >= 1) ─────────────────────────────────
  return (
    <div>
      <div
        onClick={() => {
          if (hasChildren) setExpanded(!expanded)
          onSelect(node)
        }}
        className={cn(
          'group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50',
          'border-b border-border/30',
          isSelected && 'bg-primary/5',
        )}
        style={{ paddingLeft: `${(depth - 1) * 16 + 16}px` }}
      >
        {/* Expand or leaf icon */}
        <span className="w-4 flex-shrink-0 flex justify-center">
          {hasChildren ? (
            expanded
              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <FileText className="h-3 w-3 text-muted-foreground/40" />
          )}
        </span>

        {/* Title */}
        <span className={cn('flex-1 text-sm text-foreground truncate', depth === 1 && 'font-medium')}>
          {node.title}
        </span>

        {/* Completion for parent topics */}
        {hasChildren && completionPct > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">{completionPct}%</span>
        )}

        {/* Confidence stars for leaf topics */}
        {node.is_leaf && (
          <span onClick={(e) => e.stopPropagation()}>
            <ConfidenceStars
              rating={progress?.confidence_rating ?? null}
              onChange={handleConfidenceChange}
              size="sm"
            />
          </span>
        )}

        {/* Status badge */}
        <StatusBadge status={status} size="xs" />

        {/* Status dropdown for leaf topics */}
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
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}

        {/* Action buttons */}
        <span
          className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            title="Add sub-topic"
            onClick={() => onAddChild(node)}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            title="Edit"
            onClick={() => onEdit(node)}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            title="Delete"
            onClick={() => onDelete(node)}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>

      {/* Sub-topics */}
      {hasChildren && expanded && (
        <div>
          {children.map((child) => (
            <SyllabusNodeRow
              key={child.id}
              node={child}
              allNodes={allNodes}
              progress={getProgress(child.id)}
              completionPct={getCompletion(child.id)}
              depth={depth + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              getProgress={getProgress}
              getCompletion={getCompletion}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function getAncestorIds(node: SyllabusNode, all: SyllabusNode[]): string[] {
  const ids: string[] = []
  let current: SyllabusNode | undefined = node
  while (current?.parent_id) {
    ids.push(current.parent_id)
    current = all.find((n) => n.id === current!.parent_id)
  }
  return ids
}
