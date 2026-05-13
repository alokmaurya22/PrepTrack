import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { useAllSyllabusNodes, useUserProgress, useSearchSyllabus } from '../lib/queries/syllabus'
import { SyllabusNodeRow } from '../components/syllabus/SyllabusNodeRow'
import { NodeDetailPanel } from '../components/syllabus/NodeDetailPanel'
import { buildSyllabusTree, computeNodeCompletion } from '../lib/utils/completion'
import type { SyllabusNode } from '../lib/queries/syllabus'

export function SyllabusPage() {
  const { data: allNodes, isLoading } = useAllSyllabusNodes()
  const { data: progressMap } = useUserProgress()

  const [selectedNode, setSelectedNode] = useState<SyllabusNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStage, setFilterStage] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const { data: searchResults } = useSearchSyllabus(searchQuery)

  // Build tree from flat nodes
  const tree = useMemo(() => {
    if (!allNodes) return []
    return buildSyllabusTree(allNodes, null)
  }, [allNodes])

  // Filter tree by stage
  const filteredTree = useMemo(() => {
    if (filterStage === 'all') return tree
    return tree.filter((n) => n.stage === filterStage)
  }, [tree, filterStage])

  // Get children for a node
  const getChildren = (nodeId: string) => {
    if (!allNodes) return []
    return buildSyllabusTree(allNodes, nodeId)
  }

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

  // Overall stats
  const stats = useMemo(() => {
    if (!allNodes || !progressMap) return { total: 0, completed: 0, inProgress: 0 }
    const leaves = allNodes.filter((n) => n.is_leaf)
    const completed = leaves.filter((n) => progressMap[n.id]?.status === 'completed').length
    const inProgress = leaves.filter((n) => progressMap[n.id]?.status === 'in_progress').length
    return { total: leaves.length, completed, inProgress }
  }, [allNodes, progressMap])

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
        </div>

        {/* Search + Filters */}
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
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="text-xs border border-border rounded-md px-2 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Stages</option>
            <option value="prelims">Prelims</option>
            <option value="mains">Mains</option>
            <option value="interview">Interview</option>
          </select>

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
                  <span className="text-xs text-muted-foreground mr-2">[{node.stage}]</span>
                  {node.title}
                </div>
              ))}
            </div>
          ) : (
            // Tree view
            <div>
              {filteredTree.map((node) => (
                <SyllabusNodeRow
                  key={node.id}
                  node={node}
                  children={getChildren(node.id)}
                  progress={getProgress(node.id)}
                  completionPct={getCompletion(node.id)}
                  depth={0}
                  onSelect={setSelectedNode}
                  selectedId={selectedNode?.id ?? null}
                />
              ))}
              {filteredTree.length === 0 && (
                <p className="p-6 text-sm text-muted-foreground text-center">
                  No syllabus data available. Ask the senior developer to seed the syllabus_nodes table.
                </p>
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
    </div>
  )
}