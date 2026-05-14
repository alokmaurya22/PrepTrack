import { useState, useEffect } from 'react'
import { X, BookOpen, CheckCircle2, RotateCcw, Clock, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useCreateSyllabusNode, useUpdateSyllabusNode } from '../../lib/queries/syllabus'
import type { SyllabusNode } from '../../lib/queries/syllabus'

interface NodeModalProps {
  mode: 'create' | 'edit'
  parentNode?: SyllabusNode | null
  node?: SyllabusNode
  siblingCount: number
  /** When provided, user must pick a subject first (Add Topic flow) */
  subjects?: SyllabusNode[]
  onClose: () => void
}

type Status = 'not_started' | 'in_progress' | 'completed' | 'needs_revision'

const STATUS_OPTIONS: {
  value: Status
  label: string
  sub: string
  icon: React.ElementType
  active: string
}[] = [
  { value: 'not_started',    label: 'Not Started',    sub: 'Yet to begin',           icon: BookOpen,      active: 'border-slate-400 bg-slate-100 dark:bg-slate-800 dark:border-slate-500' },
  { value: 'in_progress',    label: 'In Progress',    sub: 'Currently studying',     icon: Clock,         active: 'border-blue-500 bg-blue-50 dark:bg-blue-950/40' },
  { value: 'completed',      label: 'Completed',      sub: 'Done, no revision due',  icon: CheckCircle2,  active: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
  { value: 'needs_revision', label: 'Needs Revision', sub: 'Studied, needs revisit', icon: RotateCcw,     active: 'border-amber-500 bg-amber-50 dark:bg-amber-950/40' },
]

function getModalTitle(mode: 'create' | 'edit', parentNode?: SyllabusNode | null, node?: SyllabusNode, subjects?: SyllabusNode[]) {
  if (mode === 'edit') {
    return node?.level === 0 ? 'Edit subject' : 'Edit topic'
  }
  if (subjects) return 'Add topic'          // subject picker flow
  if (!parentNode) return 'Add new subject'
  return `Add topic — ${parentNode.title}`
}

function fromTotalHours(total: number) {
  const d = Math.floor(total / 24)
  const h = total % 24
  return { days: d, hrs: h === 0 && d > 0 ? 0 : (h === 0 ? 2 : h) }
}

export function NodeModal({ mode, parentNode, node, siblingCount, subjects, onClose }: NodeModalProps) {
  const createNode = useCreateSyllabusNode()
  const updateNode = useUpdateSyllabusNode()

  // When subjects[] provided, user picks a subject first
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects?.[0]?.id ?? '')

  const resolvedParent: SyllabusNode | null | undefined =
    subjects
      ? subjects.find((s) => s.id === selectedSubjectId) ?? subjects[0] ?? null
      : parentNode

  const isSubjectLevel = mode === 'create' ? !subjects && !parentNode : node?.level === 0

  const [title, setTitle] = useState('')
  const [stage, setStage] = useState<'prelims' | 'mains' | 'interview' | ''>('')
  const [paper, setPaper] = useState('')
  const [days, setDays] = useState(0)
  const [hrs, setHrs] = useState(2)
  const [description, setDescription] = useState('')
  const [isLeaf, setIsLeaf] = useState(true)
  const [initialStatus, setInitialStatus] = useState<Status>('not_started')

  // Populate in edit mode
  useEffect(() => {
    if (mode === 'edit' && node) {
      setTitle(node.title)
      setStage((node.stage as typeof stage) ?? '')
      setPaper(node.paper ?? '')
      const parsed = fromTotalHours(node.default_hours ?? 2)
      setDays(parsed.days)
      setHrs(parsed.hrs)
      setDescription(node.description ?? '')
      setIsLeaf(node.is_leaf)
    }
  }, [mode, node])

  const totalHours = days * 24 + hrs

  const isPending = createNode.isPending || updateNode.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (mode === 'create') {
      const parent = resolvedParent
      createNode.mutate(
        {
          parent_id: parent?.id ?? null,
          title: title.trim(),
          stage: stage || null,
          paper: paper.trim() || undefined,
          description: description.trim() || undefined,
          default_hours: Math.max(1, totalHours),
          is_leaf: subjects ? isLeaf : (isSubjectLevel ? false : isLeaf),
          level: (parent?.level ?? -1) + 1,
          sort_order: siblingCount + 1,
          initialStatus: (isSubjectLevel || isLeaf) ? initialStatus : undefined,
        },
        { onSuccess: onClose },
      )
    } else if (mode === 'edit' && node) {
      updateNode.mutate(
        {
          id: node.id,
          title: title.trim(),
          stage: stage || null,
          paper: paper.trim() || undefined,
          description: description.trim() || undefined,
          default_hours: Math.max(1, totalHours),
          is_leaf: isLeaf,
        },
        { onSuccess: onClose },
      )
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-lg rounded-xl bg-background shadow-xl border border-border max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-base font-semibold text-foreground truncate pr-4">
            {getModalTitle(mode, parentNode, node, subjects)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 overflow-y-auto flex-1">

          {/* ── Subject picker (only for "Add Topic" flow) ── */}
          {subjects && subjects.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Add under which subject? <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none pr-8"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}

          {/* ── Title ── */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {isSubjectLevel ? 'Subject name' : 'Topic name'}{' '}
              <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                isSubjectLevel
                  ? 'e.g. History, Geography, Polity…'
                  : 'e.g. Ancient India, Indian Constitution…'
              }
              required
              autoFocus
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* ── Stage + Paper ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as typeof stage)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">None</option>
                <option value="prelims">Prelims</option>
                <option value="mains">Mains</option>
                <option value="interview">Interview</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Paper</label>
              <input
                type="text"
                value={paper}
                onChange={(e) => setPaper(e.target.value)}
                placeholder="GS Paper 1…"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* ── Time needed: Days + Hours ── */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Estimated time to study
            </label>
            <div className="flex items-center gap-3">
              {/* Days input */}
              <div className="flex-1">
                <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={days}
                    onChange={(e) => setDays(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-transparent text-sm text-foreground focus:outline-none tabular-nums"
                  />
                  <span className="text-sm text-muted-foreground flex-shrink-0">days</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 text-center">1 day = 24 hrs</p>
              </div>

              <span className="text-muted-foreground text-sm font-medium">+</span>

              {/* Hours input */}
              <div className="flex-1">
                <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={hrs}
                    onChange={(e) => setHrs(Math.min(23, Math.max(0, Number(e.target.value))))}
                    className="w-full bg-transparent text-sm text-foreground focus:outline-none tabular-nums"
                  />
                  <span className="text-sm text-muted-foreground flex-shrink-0">hrs</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 text-center">0–23 hours</p>
              </div>
            </div>

            {/* Total display */}
            <div className="mt-2 px-3 py-2 rounded-md bg-muted/50 text-xs text-muted-foreground text-center">
              Total:{' '}
              <span className="font-semibold text-foreground">
                {totalHours} hour{totalHours !== 1 ? 's' : ''}
              </span>
              {days > 0 && (
                <span> ({days}d {hrs}h)</span>
              )}
              {' '}stored internally
            </div>
          </div>

          {/* ── Status selector (on create, for both subjects and leaf topics) ── */}
          {mode === 'create' && (isSubjectLevel || isLeaf) && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                What is the current status of this {isSubjectLevel ? 'subject' : 'topic'}?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((opt) => {
                  const Icon = opt.icon
                  const isActive = initialStatus === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setInitialStatus(opt.value)}
                      className={cn(
                        'flex items-start gap-2.5 p-3 rounded-lg border-2 text-left transition-all',
                        isActive ? opt.active : 'border-border bg-background hover:bg-muted/50',
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">{opt.label}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{opt.sub}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Notes ── */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Notes (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Important books, source material, etc."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* ── Leaf toggle (for non-subject creates) ── */}
          {!isSubjectLevel && (
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isLeaf}
                onChange={(e) => setIsLeaf(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                This is a final topic — no sub-topics will be added under it
              </span>
            </label>
          )}

          {/* ── Actions ── */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim()}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
                (isPending || !title.trim()) && 'opacity-50 cursor-not-allowed',
              )}
            >
              {isPending
                ? 'Saving…'
                : mode === 'create'
                ? isSubjectLevel ? 'Add subject' : 'Add topic'
                : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
