import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    let lastKey = ''

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return

      if (e.key === '/') {
        e.preventDefault()
        document.dispatchEvent(new CustomEvent('open-search'))
        return
      }

      if (lastKey === 'g') {
        const routes: Record<string, string> = {
          d: '/', p: '/plan', s: '/syllabus',
          n: '/notes', a: '/analytics',
        }
        if (routes[e.key]) navigate(routes[e.key])
      }

      lastKey = e.key
      setTimeout(() => { lastKey = '' }, 1000)
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])
}