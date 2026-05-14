import { useState, useMemo } from 'react'
import { Search, X, Plus, BookOpen, CalendarDays, FileText, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  useAllSyllabusNodes,
  useUserProgress,
  useSearchSyllabus,
  useDeleteSyllabusNode,
} from '../lib/queries/syllabus'
import { SyllabusNodeRow } from '../components/syllabus/SyllabusNodeRow'
import { NodeDetailPanel } from '../components/syllabus/NodeDetailPanel'
import { NodeModal } from '../components/syllabus/NodeModal'
import { buildSyllabusTree, computeNodeCompletion } from '../lib/utils/completion'
import type { SyllabusNode } from '../lib/queries/syllabus'
import { cn } from '../lib/utils'

type ModalState =
  | { mode: 'create'; parent: SyllabusNode | null; pickSubject?: boolean }
  | { mode: 'edit'; node: SyllabusNode }
  | null

export function SyllabusPage() {
  const { data: allNodes, isLoading } = useAllSyllabusNodes()
  const { data: progressMap } = useUserProgress()
  const deleteNode = useDeleteSyllabusNode()

  const [selectedNode, setSelectedNode] = useState<SyllabusNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [modalState, setModalState] = useState<ModalState>(null)

  const { data: searchResults } = useSearchSyllabus(searchQuery)

  // Build tree from flat nodes
  const tree = useMemo(() => {
    if (!allNodes) return []
    return buildSyllabusTree(allNodes, null)
  }, [allNodes])

  // Get completion % for a node
  const getCompletion = (nodeId: string) => {
    if (!allNodes || !progressMap) return 0
    return computeNodeCompletion(nodeId, allNodes, progressMap)
  }

  // Get progress for a node
  const getProgress = (nodeId: string) => {
    if (!progressMap) return undefined
    return progressMap[nodeId]
  }

  // Count siblings for sort_order on create
  const getSiblingCount = (parentId: string | null) => {
    if (!allNodes) return 0
    return allNodes.filter((n) => n.parent_id === parentId).length
  }

  // Overall stats
  const stats = useMemo(() => {
    if (!allNodes || !progressMap) return { total: 0, completed: 0, inProgress: 0, remaining: 0, remainingHours: 0, subjects: 0 }
    const leaves = allNodes.filter((n) => n.is_leaf)
    const completed = leaves.filter((n) => progressMap[n.id]?.status === 'completed').length
    const inProgress = leaves.filter((n) => progressMap[n.id]?.status === 'in_progress').length
    const remaining = leaves.filter((n) => progressMap[n.id]?.status !== 'completed')
    const remainingHours = remaining.reduce((sum, n) => sum + (n.default_hours || 1), 0)
    return {
      total: leaves.length,
      completed,
      inProgress,
      remaining: remaining.length,
      remainingHours,
      subjects: allNodes.filter((n) => n.level === 0).length,
    }
  }, [allNodes, progressMap])

  const handleDelete = (node: SyllabusNode) => {
    if (!window.confirm('Delete this topic and all subtopics?')) return
    deleteNode.mutate(node.id)
    // Deselect if deleted node was selected
    if (selectedNode?.id === node.id) setSelectedNode(null)
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading syllabus…</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Syllabus</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stats.completed}/{stats.total} topics completed ({stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Add Topic — only when at least one subject exists */}
            {(allNodes ?? []).filter(n => n.level === 0).length > 0 && (
              <button
                onClick={() => setModalState({ mode: 'create', parent: null, pickSubject: true })}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors"
              >
                <FileText className="h-4 w-4" />
                Add Topic
              </button>
            )}
            <button
              onClick={() => setModalState({ mode: 'create', parent: null })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Subject
            </button>
          </div>
        </div>

        {/* Search + Status Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search topics…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border border-border rounded-md px-2 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="needs_revision">Needs Revision</option>
          </select>
        </div>
      </div>

      {/* Summary banner — shown once data is loaded and there's content */}
      {stats.total > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2 border-b border-border bg-muted/20">
          {[
            { label: 'Subjects', value: stats.subjects, color: 'text-violet-600 dark:text-violet-400' },
            { label: 'Total topics', value: stats.total, color: 'text-foreground' },
            { label: 'Completed', value: stats.completed, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Remaining', value: stats.remaining, color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Hours left', value: `${stats.remainingHours}h`, color: 'text-blue-600 dark:text-blue-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs">
              <span className={cn('font-bold text-sm tabular-nums', color)}>{value}</span>
              <span className="text-muted-foreground">{label}</span>
              <span className="text-border/60 ml-1">·</span>
            </div>
          ))}
          {stats.remaining > 0 && (
            <Link
              to="/timetable"
              className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline font-medium"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Generate timetable
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tree panel */}
        <div className="flex-1 overflow-y-auto">
          {searchQuery && searchResults ? (
            // Search results
            <div className="divide-y divide-border/50">
              {searchResults.length === 0 && (
                <p className="p-6 text-sm text-muted-foreground text-center">No topics found for "{searchQuery}"</p>
              )}
              {searchResults.map((node) => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="px-4 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors text-sm text-foreground"
                >
                  {node.stage && (
                    <span className="text-xs text-muted-foreground mr-2">[{node.stage}]</span>
                  )}
                  {node.title}
                </div>
              ))}
            </div>
          ) : (
            // Tree view
            <div>
              {tree.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">Your syllabus is empty</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add subjects, papers, and topics to start tracking your preparation.
                    </p>
                  </div>
                  <button
                    onClick={() => setModalState({ mode: 'create', parent: null })}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Add your first subject
                  </button>
                </div>
              ) : (
                tree.map((node) => (
                  <SyllabusNodeRow
                    key={node.id}
                    node={node}
                    allNodes={allNodes ?? []}
                    progress={getProgress(node.id)}
                    completionPct={getCompletion(node.id)}
                    depth={0}
                    onSelect={setSelectedNode}
                    selectedId={selectedNode?.id ?? null}
                    getProgress={getProgress}
                    getCompletion={getCompletion}
                    onEdit={(n) => setModalState({ mode: 'edit', node: n })}
                    onDelete={handleDelete}
                    onAddChild={(parent) => setModalState({ mode: 'create', parent })}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            progress={getProgress(selectedNode.id)}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>

      {/* Node Create/Edit Modal */}
      {modalState !== null && (
        <NodeModal
          mode={modalState.mode}
          parentNode={modalState.mode === 'create' ? modalState.parent : undefined}
          node={modalState.mode === 'edit' ? modalState.node : undefined}
          siblingCount={
            modalState.mode === 'create'
              ? getSiblingCount(modalState.parent?.id ?? null)
              : 0
          }
          subjects={
            modalState.mode === 'create' && modalState.pickSubject
              ? (allNodes ?? []).filter((n) => n.level === 0)
              : undefined
          }
          onClose={() => setModalState(null)}
        />
      )}
    </div>
  )
}
