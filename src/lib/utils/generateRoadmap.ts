import { supabase } from '../supabase'
import { addDays, parseISO } from 'date-fns'

export async function generateStarterRoadmap(userId: string, examDateStr: string) {
  const examDate = parseISO(examDateStr)
  const today = new Date()
  const daysLeft = Math.max(1, Math.floor((examDate.getTime() - today.getTime()) / 86400000))

  // Distribute phases proportionally
  const phases = [
    { name: 'Foundation', type: 'foundation', pct: 0.30 },
    { name: 'Consolidation', type: 'consolidation', pct: 0.20 },
    { name: 'Revision Round 1', type: 'revision_1', pct: 0.15 },
    { name: 'Revision Round 2', type: 'revision_2', pct: 0.10 },
    { name: 'Test Series', type: 'test_series', pct: 0.15 },
    { name: 'Final 60 Days', type: 'final_60', pct: 0.10 },
  ]

  let cursor = today
  const rows = phases.map((p, idx) => {
    const days = Math.floor(daysLeft * p.pct)
    const start = cursor
    const end = addDays(cursor, Math.max(days - 1, 0))
    cursor = addDays(end, 1)
    return {
      user_id: userId,
      name: p.name,
      phase_type: p.type,
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
      sort_order: idx,
    }
  })

  await supabase.from('roadmap_phases').insert(rows)
}