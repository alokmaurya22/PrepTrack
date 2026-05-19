import { useState, useEffect } from 'react'
import { X, BookOpen, CheckCircle2, RotateCcw, Clock, Search, Copy } from 'lucide-react'
import { cn } from '../../lib/utils'
import {
  useCreateSyllabusNode,
  useUpdateSyllabusNode,
  useSearchGlobalSyllabusNodes,
  useCopyNodeSubtree,
} from '../../lib/queries/syllabus'
import type { SyllabusNode, GlobalSearchNode } from '../../lib/queries/syllabus'

export type AddType = 'exam' | 'group' | 'subject' | 'topic'

interface NodeModalProps {
  mode: 'create' | 'edit'
  parentNode?: SyllabusNode | null
  addType?: AddType
  /** All nodes — used to build parent picker when parentNode is null */
  allNodes?: SyllabusNode[]
  node?: SyllabusNode
  siblingCount: number
  onClose: () => void
}

type Status = 'not_started' | 'in_progress' | 'completed' | 'needs_revision'

const STATUS_OPTIONS: {
  value: Status; label: string; sub: string; icon: React.ElementType; active: string
}[] = [
  { value: 'not_started',    label: 'Not Started',    sub: 'Yet to begin',           icon: BookOpen,     active: 'border-slate-400 bg-slate-100 dark:bg-slate-800 dark:border-slate-500' },
  { value: 'in_progress',    label: 'In Progress',    sub: 'Currently studying',     icon: Clock,        active: 'border-blue-500 bg-blue-50 dark:bg-blue-950/40' },
  { value: 'completed',      label: 'Completed',      sub: 'Done, no revision due',  icon: CheckCircle2, active: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
  { value: 'needs_revision', label: 'Needs Revision', sub: 'Studied, needs revisit', icon: RotateCcw,    active: 'border-amber-500 bg-amber-50 dark:bg-amber-950/40' },
]

const ADD_CONFIG: Record<AddType, { title: string; placeholder: string; isLeafDefault: boolean; searchPlaceholder: string }> = {
  exam:    { title: 'Add Exam',    placeholder: 'e.g. UPSC Mains, UPSC Prelims, State PSC…', isLeafDefault: false, searchPlaceholder: 'Search exams added by others…' },
  group:   { title: 'Add Paper',   placeholder: 'e.g. Paper I, GS-1, Optional, Essay…',       isLeafDefault: false, searchPlaceholder: 'Search papers e.g. GS-1, Optional…' },
  subject: { title: 'Add Subject', placeholder: 'e.g. Art & Culture, Indian Polity…',         isLeafDefault: false, searchPlaceholder: 'Search subjects others have added…' },
  topic:   { title: 'Add Topic',   placeholder: 'e.g. Temple Architecture, Federalism…',      isLeafDefault: true,  searchPlaceholder: 'Search topics others have added…' },
}

function getEditTitle(node?: SyllabusNode) {
  if (!node) return 'Edit'
  if (node.parent_id === null) return 'Edit Exam'
  if (node.level === 2) return 'Edit Paper / Subject'
  if (node.level === 3) return 'Edit Subject'
  return 'Edit Topic'
}

function fromTotalHours(total: number) {
  const d = Math.floor(total / 24)
  const h = total % 24
  return { days: d, hrs: h === 0 && d > 0 ? 0 : (h === 0 ? 2 : h) }
}

// Which levels can be a parent for each addType
function getValidParentLevels(addType: AddType): number[] {
  if (addType === 'group')   return [1]           // group goes under exam (level 1)
  if (addType === 'subject') return [1, 2]        // subject under exam or group
  if (addType === 'topic')   return [2, 3, 4, 5]  // topic under subject or deeper
  return []
}

export function NodeModal({ mode, parentNode, addType = 'topic', allNodes = [], node, siblingCount, onClose }: NodeModalProps) {
  const createNode   = useCreateSyllabusNode()
  const updateNode   = useUpdateSyllabusNode()
  const copySubtree  = useCopyNodeSubtree()

  const cfg = ADD_CONFIG[addType]

  // Parent picker: shown when opened from top header (parentNode is null) for non-exam types
  const needsParentPicker = mode === 'create' && addType !== 'exam' && parentNode === null
  const validParentLevels = getValidParentLevels(addType)
  const parentOptions = allNodes.filter(n => validParentLevels.includes(n.level) && !n.is_leaf)
  const [pickedParentId, setPickedParentId] = useState<string>(parentOptions[0]?.id ?? '')
  const resolvedParent: SyllabusNode | null =
    needsParentPicker
      ? (parentOptions.find(n => n.id === pickedParentId) ?? parentOptions[0] ?? null)
      : (parentNode ?? null)

  const [tab, setTab] = useState<'create' | 'copy'>('create')
  const [searchQuery, setSearchQuery] = useState('')

  const [title, setTitle] = useState('')
  const [stage, setStage] = useState<'prelims' | 'mains' | 'interview' | ''>('')
  const [paper, setPaper] = useState('')
  const [days, setDays] = useState(0)
  const [hrs, setHrs] = useState(2)
  const [description, setDescription] = useState('')
  const [isLeaf, setIsLeaf] = useState(cfg.isLeafDefault)
  const [initialStatus, setInitialStatus] = useState<Status>('not_started')

  // Level of node being created: resolvedParent.level + 1, or 1 for root
  const newLevel = (resolvedParent?.level ?? 0) + 1

  const { data: searchResults, isFetching: searching } = useSearchGlobalSyllabusNodes(
    tab === 'copy' ? searchQuery : '',
    newLevel,
  )

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
      createNode.mutate(
        {
          parent_id: resolvedParent?.id ?? null,
          title: title.trim(),
          stage: stage || null,
          paper: paper.trim() || undefined,
          description: description.trim() || undefined,
          default_hours: Math.max(1, totalHours),
          is_leaf: isLeaf,
          level: newLevel,
          sort_order: siblingCount + 1,
          initialStatus: isLeaf ? initialStatus : undefined,
          metadata: { nodeType: addType },
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

  const handleCopy = (result: GlobalSearchNode) => {
    copySubtree.mutate(
      {
        sourceId: result.id,
        parentId: resolvedParent?.id ?? null,
        level: newLevel,
        sortOrder: siblingCount + 1,
      },
      { onSuccess: onClose },
    )
  }

  const modalTitle = mode === 'edit' ? getEditTitle(node) : cfg.title

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !copySubtree.isPending) onClose() }}
    >
      <div className="relative w-full max-w-lg rounded-xl bg-background shadow-xl border border-border max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-base font-semibold text-foreground truncate pr-4">{modalTitle}</h2>
          <button type="button" onClick={onClose} disabled={copySubtree.isPending} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs — only in create mode */}
        {mode === 'create' && (
          <div className="flex border-b border-border flex-shrink-0">
            <button
              type="button" onClick={() => setTab('create')}
              className={cn(
                'flex-1 py-2.5 text-xs font-medium transition-colors',
                tab === 'create' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Create New
            </button>
            <button
              type="button" onClick={() => setTab('copy')}
              className={cn(
                'flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors',
                tab === 'copy' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy from Existing
            </button>
          </div>
        )}

        {/* ── Copy Tab ── */}
        {mode === 'create' && tab === 'copy' && (
          <div className="flex flex-col flex-1 overflow-hidden px-5 py-4 gap-3">
            <p className="text-xs text-muted-foreground">
              Search from others' syllabi and copy it with all its sub-items (papers → subjects → topics). You can edit your copy independently.
            </p>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text" autoFocus value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={cfg.searchPlaceholder}
                className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex-1 overflow-y-auto rounded-md border border-border divide-y divide-border/50 min-h-[120px]">
              {searchQuery.length < 2 && (
                <p className="p-4 text-xs text-muted-foreground text-center">Type at least 2 characters to search…</p>
              )}
              {searchQuery.length >= 2 && searching && (
                <p className="p-4 text-xs text-muted-foreground text-center animate-pulse">Searching…</p>
              )}
              {searchQuery.length >= 2 && !searching && (!searchResults || searchResults.length === 0) && (
                <p className="p-4 text-xs text-muted-foreground text-center">No results found.</p>
              )}
              {copySubtree.isPending && (
                <p className="p-4 text-xs text-muted-foreground text-center animate-pulse">Copying with all sub-items…</p>
              )}
              {!copySubtree.isPending && searchResults?.map((result) => (
                <button
                  key={result.id} type="button"
                  disabled={copySubtree.isPending}
                  onClick={() => handleCopy(result)}
                  className="w-full text-left px-4 py-3 hover:bg-muted/60 transition-colors disabled:opacity-50"
                >
                  <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                  {(result.stage || result.paper) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[result.stage, result.paper].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Create / Edit Form ── */}
        {(mode === 'edit' || tab === 'create') && (
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 overflow-y-auto flex-1">

            {/* Parent picker — only shown when opened from top header */}
            {needsParentPicker && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Add under <span className="text-destructive">*</span>
                </label>
                {parentOptions.length === 0 ? (
                  <p className="text-xs text-destructive">No valid parent found. Add an exam first.</p>
                ) : (
                  <select
                    value={pickedParentId}
                    onChange={(e) => setPickedParentId(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {parentOptions.map(n => (
                      <option key={n.id} value={n.id}>{n.title}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder={mode === 'edit' ? node?.title : cfg.placeholder}
                required autoFocus
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Stage</label>
                <select
                  value={stage} onChange={(e) => setStage(e.target.value as typeof stage)}
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
                  type="text" value={paper} onChange={(e) => setPaper(e.target.value)}
                  placeholder="GS Paper 1…"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Estimated study time</label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
                    <input type="number" min={0} max={365} value={days}
                      onChange={(e) => setDays(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-transparent text-sm text-foreground focus:outline-none tabular-nums"
                    />
                    <span className="text-sm text-muted-foreground flex-shrink-0">days</span>
                  </div>
                </div>
                <span className="text-muted-foreground text-sm font-medium">+</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
                    <input type="number" min={0} max={23} value={hrs}
                      onChange={(e) => setHrs(Math.min(23, Math.max(0, Number(e.target.value))))}
                      className="w-full bg-transparent text-sm text-foreground focus:outline-none tabular-nums"
                    />
                    <span className="text-sm text-muted-foreground flex-shrink-0">hrs</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 px-3 py-1.5 rounded-md bg-muted/50 text-xs text-muted-foreground text-center">
                Total: <span className="font-semibold text-foreground">{totalHours}h</span>
              </div>
            </div>

            {mode === 'create' && isLeaf && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Current status</label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const isActive = initialStatus === opt.value
                    return (
                      <button key={opt.value} type="button" onClick={() => setInitialStatus(opt.value)}
                        className={cn('flex items-start gap-2.5 p-3 rounded-lg border-2 text-left transition-all',
                          isActive ? opt.active : 'border-border bg-background hover:bg-muted/50')}
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

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Notes (optional)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                rows={2} placeholder="Important books, source material, etc."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {addType !== 'exam' && addType !== 'group' && mode === 'create' && (
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={isLeaf} onChange={(e) => setIsLeaf(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  This is a final topic — no sub-topics will be added under it
                </span>
              </label>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose}
                className="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button type="submit" disabled={isPending || !title.trim()}
                className={cn('px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
                  (isPending || !title.trim()) && 'opacity-50 cursor-not-allowed')}
              >
                {isPending ? 'Saving…' : mode === 'create' ? cfg.title : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
