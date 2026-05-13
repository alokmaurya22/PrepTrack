import type { SyllabusNode, UserProgress } from '../queries/syllabus'

/**
 * Calculate the % completion for a given node, rolled up from its leaf descendants.
 * Returns 0 for non-leaf nodes that have no progress data yet.
 *
 * mode:
 *  - 'leaf_strict': Only count leaf nodes marked as 'completed' (default)
 *  - 'any_progress': Count any leaf node with progress (not 'not_started')
 */
export function computeNodeCompletion(
  nodeId: string,
  allNodes: SyllabusNode[],
  progressMap: Record<string, UserProgress>,
  mode: 'leaf_strict' | 'any_progress' = 'leaf_strict'
): number {
  const children = allNodes.filter((n) => n.parent_id === nodeId)

  if (children.length === 0) {
    // Leaf node — check its own progress
    const p = progressMap[nodeId]
    if (!p) return 0
    if (mode === 'any_progress') return p.status !== 'not_started' ? 100 : 0
    return p.status === 'completed' ? 100 : 0
  }

  // Roll up from children
  const total = children.length
  if (total === 0) return 0

  const sum = children.reduce((acc, child) => {
    return acc + computeNodeCompletion(child.id, allNodes, progressMap, mode)
  }, 0)

  return Math.round(sum / total)
}

/**
 * Build a tree from the flat array of nodes
 */
export function buildSyllabusTree(
  allNodes: SyllabusNode[],
  parentId: string | null = null
): SyllabusNode[] {
  return allNodes
    .filter((n) => n.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order)
}

/**
 * Count total leaf nodes under a given parent (for progress tracking)
 */
export function countLeafDescendants(
  nodeId: string,
  allNodes: SyllabusNode[]
): number {
  const children = allNodes.filter((n) => n.parent_id === nodeId)

  if (children.length === 0) return 1 // this node is a leaf

  return children.reduce(
    (sum, child) => sum + countLeafDescendants(child.id, allNodes),
    0
  )
}

/**
 * Count completed leaf nodes under a parent
 */
export function countCompletedLeaves(
  nodeId: string,
  allNodes: SyllabusNode[],
  progressMap: Record<string, UserProgress>
): number {
  const children = allNodes.filter((n) => n.parent_id === nodeId)

  if (children.length === 0) {
    const p = progressMap[nodeId]
    return p?.status === 'completed' ? 1 : 0
  }

  return children.reduce(
    (sum, child) =>
      sum + countCompletedLeaves(child.id, allNodes, progressMap),
    0
  )
}