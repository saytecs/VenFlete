"use client"
import { useState, useEffect } from 'react'
import { AUTH_STATE_CHANGED_EVENT } from '../lib/auth-events'

export default function Header() {
  const [email, setEmail] = useState('')
  const [user, setUser] = useState<{ id: number; email: string; role: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [isAuthChanging, setIsAuthChanging] = useState(true)

  async function syncUser() {
    try {
      const res = await fetch('/api/auth')
      const data = await res.json()
      setUser(data.user)
    } finally {
      setIsAuthChanging(false)
    }
  }

  useEffect(() => {
    setIsAuthChanging(true)
    syncUser()
    const onAuthChanged = () => {
      setIsAuthChanging(true)
      syncUser()
    }

    window.addEventListener(AUTH_STATE_CHANGED_EVENT, onAuthChanged)
    return () => window.removeEventListener(AUTH_STATE_CHANGED_EVENT, onAuthChanged)
  }, [])

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setIsAuthChanging(true)
    const res = await fetch('/api/auth', { method: 'POST', body: JSON.stringify({ email }), headers: { 'Content-Type': 'application/json' } })
    const data = await res.json()
    setUser(data.user)
    setEmail('')
    setLoading(false)
    if (res.ok) {
      window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT))
    }
    window.setTimeout(() => setIsAuthChanging(false), 140)
  }

  async function logout() {
    setIsAuthChanging(true)
    await fetch('/api/auth', { method: 'DELETE' })
    setUser(null)
    window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT))
    window.setTimeout(() => setIsAuthChanging(false), 140)
  }

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e5e7eb', background: '#fff', position: 'sticky', top: 0, zIndex: 10, transition: 'opacity 180ms ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: isAuthChanging ? 0.75 : 1, transition: 'opacity 180ms ease' }}>
        <div style={{ fontWeight: 800, fontSize: 20 }}>VenFlete</div>
        <div style={{ color: '#6b7280' }}>Logística de casilleros</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: isAuthChanging ? 0.9 : 1, transition: 'opacity 180ms ease, transform 180ms ease' }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ color: '#111827' }}>{user.email}</div>
            <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 999, color: '#0f172a' }}>{user.role}</div>
            <button onClick={logout} style={{ padding: '10px 16px', borderRadius: 999, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Cerrar sesión</button>
          </div>
        ) : (
          <form onSubmit={login} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              placeholder="Ingresa tu correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 999, border: '1px solid #d1d5db', minWidth: 240 }}
              required
            />
            <button type="submit" disabled={loading} style={{ padding: '10px 18px', borderRadius: 999, border: 'none', background: '#0f172a', color: '#fff', cursor: 'pointer' }}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        )}
      </div>
    </header>
  )
}
