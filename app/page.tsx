"use client"
import React, { useEffect, useMemo, useState } from "react"
import { AUTH_STATE_CHANGED_EVENT } from "../lib/auth-events"

type Role = 'ADMIN' | 'CLIENT'

type Status = 'PENDING' | 'DISPATCHED' | 'DELIVERED'

type User = {
  id: number
  email: string
  role: Role
}

type ClientInfo = {
  id: number
  email: string
}

type ItemData = {
  id: number
  trackingNumber: string
  description: string
  length?: number | null
  width?: number | null
  height?: number | null
  weight?: number | null
  volume?: number | null
  isAir: boolean
  isSea: boolean
  clientId: number
  client?: ClientInfo | null
  clientEmail?: string
}

type LockerClient = {
  id: number
  email: string
  name?: string | null
  guideNumber: string
  lockerDate: string
  status: Status
  itemsCount: number
  createdAt: string
}

type ItemForm = {
  trackingNumber: string
  description: string
  length: string
  width: string
  height: string
  weight: string
  volume: string
  isAir: boolean
  isSea: boolean
  clientEmail: string
}

type LockerForm = {
  email: string
  name: string
  guideNumber: string
  lockerDate: string
  status: Status
}

const MENU_ITEMS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'casilleros', label: 'Artículos' },
  { key: 'clientes', label: 'Casilleros' },
  { key: 'valores', label: 'Valores' },
]

const today = new Date().toISOString().slice(0, 10)

const emptyItemForm: ItemForm = {
  trackingNumber: '',
  description: '',
  length: '',
  width: '',
  height: '',
  weight: '',
  volume: '',
  isAir: false,
  isSea: false,
  clientEmail: '',
}

const emptyLockerForm: LockerForm = {
  email: '',
  name: '',
  guideNumber: '',
  lockerDate: today,
  status: 'PENDING',
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [items, setItems] = useState<ItemData[]>([])
  const [lockers, setLockers] = useState<LockerClient[]>([])
  const [selectedMenu, setSelectedMenu] = useState<string>('dashboard')
  const [itemForm, setItemForm] = useState<ItemForm>({ ...emptyItemForm })
  const [lockerForm, setLockerForm] = useState<LockerForm>({ ...emptyLockerForm })
  const [editingItem, setEditingItem] = useState<ItemData | null>(null)
  const [editingLocker, setEditingLocker] = useState<LockerClient | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lockerError, setLockerError] = useState<string | null>(null)
  const [isAuthChanging, setIsAuthChanging] = useState(true)

  async function refreshSessionData() {
    setIsAuthChanging(true)
    await Promise.all([fetchAuth(), fetchItems(), fetchLockers()])
    setIsAuthChanging(false)
  }

  useEffect(() => {
    refreshSessionData()

    const onAuthChanged = () => {
      refreshSessionData()
    }

    window.addEventListener(AUTH_STATE_CHANGED_EVENT, onAuthChanged)
    return () => window.removeEventListener(AUTH_STATE_CHANGED_EVENT, onAuthChanged)
  }, [])

  async function fetchAuth() {
    const res = await fetch('/api/auth')
    const data = await res.json()
    setUser(data.user)
  }

  async function fetchItems() {
    const res = await fetch('/api/lockers')
    const data = await res.json()
    setItems(data.lockers || [])
  }

  async function fetchLockers() {
    const res = await fetch('/api/clients')
    const data = await res.json()
    setLockers(data.clients || [])
  }

  function computeCost(item: ItemData) {
    const weightCost = (item.weight || 0) * 2
    const volumeCost = (item.volume || 0) * 100
    let base = weightCost + volumeCost
    if (item.isAir) base *= 1.5
    if (item.isSea) base *= 1.1
    return base.toFixed(2)
  }

  const adminMode = user?.role === 'ADMIN'
  const clientMode = user?.role === 'CLIENT'
  const visibleMenuItems = user
    ? adminMode
      ? MENU_ITEMS
      : MENU_ITEMS.filter((item) => item.key !== 'clientes')
    : []

  const summaries = useMemo(() => {
    return {
      totalCasilleros: lockers.length,
      totalArticulos: items.length,
    }
  }, [lockers.length, items.length])

  async function handleSubmitItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload: Record<string, unknown> = {
      trackingNumber: itemForm.trackingNumber,
      description: itemForm.description,
      clientEmail: itemForm.clientEmail,
      isAir: itemForm.isAir,
      isSea: itemForm.isSea,
    }

    if (itemForm.length !== '') payload.length = Number(itemForm.length)
    if (itemForm.width !== '') payload.width = Number(itemForm.width)
    if (itemForm.height !== '') payload.height = Number(itemForm.height)
    if (itemForm.weight !== '') payload.weight = Number(itemForm.weight)
    if (itemForm.volume !== '') payload.volume = Number(itemForm.volume)

    const method = editingItem ? 'PATCH' : 'POST'
    if (editingItem) payload.id = editingItem.id

    const res = await fetch('/api/lockers', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (res.ok && data.locker) {
      await fetchItems()
      setItemForm({ ...emptyItemForm })
      setEditingItem(null)
    } else {
      setError(data.error || 'No se pudo guardar el artículo')
    }

    setLoading(false)
  }

  async function handleSubmitLocker(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setLockerError(null)

    const payload: Record<string, unknown> = {
      email: lockerForm.email,
      name: lockerForm.name,
      guideNumber: lockerForm.guideNumber,
      lockerDate: lockerForm.lockerDate,
      status: lockerForm.status,
    }

    const method = editingLocker ? 'PATCH' : 'POST'
    if (editingLocker) payload.id = editingLocker.id

    const res = await fetch('/api/clients', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    let data: any = null
    try {
      data = await res.json()
    } catch {
      data = { error: 'Respuesta inválida del servidor' }
    }

    if (res.ok && data?.client) {
      await fetchLockers()
      setLockerForm({ ...emptyLockerForm })
      setEditingLocker(null)
    } else {
      setLockerError(data?.error || 'No se pudo guardar el casillero')
    }

    setLoading(false)
  }

  async function handleDeleteLocker(id: number) {
    if (!confirm('¿Eliminar este casillero?')) return
    setLoading(true)

    const res = await fetch('/api/clients', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    const data = await res.json() as { ok?: boolean; error?: string }
    if (res.ok) {
      setLockers((prev) => prev.filter((locker) => locker.id !== id))
      await fetchItems()
    } else {
      setLockerError(data.error || 'No se pudo eliminar el casillero')
    }

    setLoading(false)
  }

  async function handleDeleteItem(id: number) {
    if (!confirm('¿Eliminar este artículo?')) return
    setLoading(true)

    const res = await fetch('/api/lockers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    const data = await res.json() as { ok?: boolean; error?: string }
    if (res.ok) {
      setItems((prev) => prev.filter((item) => item.id !== id))
    } else {
      setError(data.error || 'No se pudo eliminar el artículo')
    }

    setLoading(false)
  }

  function handleEditLocker(locker: LockerClient) {
    setEditingLocker(locker)
    setLockerForm({
      email: locker.email,
      name: locker.name || '',
      guideNumber: locker.guideNumber,
      lockerDate: locker.lockerDate.slice(0, 10),
      status: locker.status,
    })
    setSelectedMenu('clientes')
  }

  function handleEditItem(item: ItemData) {
    setEditingItem(item)
    setItemForm({
      trackingNumber: item.trackingNumber,
      description: item.description,
      length: item.length != null ? String(item.length) : '',
      width: item.width != null ? String(item.width) : '',
      height: item.height != null ? String(item.height) : '',
      weight: item.weight != null ? String(item.weight) : '',
      volume: item.volume != null ? String(item.volume) : '',
      isAir: item.isAir,
      isSea: item.isSea,
      clientEmail: item.client?.email || item.clientEmail || '',
    })
    setSelectedMenu('casilleros')
  }

  if (!user) {
    return (
      <main style={{ display: 'flex', flexDirection: 'column', gap: 24, opacity: isAuthChanging ? 0.8 : 1, transition: 'opacity 220ms ease' }}>
        <section style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center' }}>
          <div style={{ maxWidth: 620 }}>
            <p style={{ textTransform: 'uppercase', letterSpacing: 2, color: '#5b5b79', marginBottom: 16 }}>Gestión de Casilleros</p>
            <h1 style={{ fontSize: 48, lineHeight: 1.05, margin: 0 }}>Administra tus casilleros y envíos con control total.</h1>
            <p style={{ fontSize: 18, color: '#4a4a60', maxWidth: 520, marginTop: 24 }}>
              Plataforma ligera para logística de casilleros, seguimiento y administración. Inicia sesión para acceder a tu casillero o administrar la operación.
            </p>
          </div>
          <div style={{ padding: 28, border: '1px solid #e5e7eb', borderRadius: 24, minWidth: 320, background: '#fafafa' }}>
            <h2 style={{ marginTop: 0 }}>Bienvenido</h2>
            <p style={{ marginBottom: 16 }}>Inicia sesión con tu correo para continuar.</p>
            <div style={{ padding: 14, borderRadius: 12, background: '#fff', border: '1px solid #dcdce1' }}>
              <p style={{ margin: 0, color: '#6b7280' }}>Usa el formulario de login en la esquina superior derecha.</p>
            </div>
          </div>
        </section>

        <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {['Casilleros', 'Clientes', 'Valores', 'Seguimiento'].map((title) => (
            <div key={title} style={{ padding: 20, borderRadius: 20, border: '1px solid #e5e7eb', background: '#fff' }}>
              <h3 style={{ margin: '0 0 12px' }}>{title}</h3>
              <p style={{ margin: 0, color: '#555' }}>Accede a {title.toLowerCase()} y administra los procesos desde una sola plataforma.</p>
            </div>
          ))}
        </section>
      </main>
    )
  }

  return (
    <main style={{ display: 'flex', gap: 24, minHeight: 'calc(100vh - 80px)', opacity: isAuthChanging ? 0.85 : 1, transition: 'opacity 220ms ease, transform 220ms ease' }}>
      {user && (
        <aside style={{ minWidth: 240, borderRadius: 24, border: '1px solid #e5e7eb', padding: 20, background: '#fff', boxShadow: '0 20px 60px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ fontWeight: 700, marginBottom: 24 }}>Menú de {adminMode ? 'administración' : 'cliente'}</div>
          {visibleMenuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setSelectedMenu(item.key)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px',
                marginBottom: 10,
                borderRadius: 14,
                border: 'none',
                background: selectedMenu === item.key ? '#0f172a' : '#f8fafc',
                color: selectedMenu === item.key ? '#fff' : '#111827',
                cursor: 'pointer',
                fontWeight: selectedMenu === item.key ? 700 : 500,
              }}
            >
              {item.label}
            </button>
          ))}
        </aside>
      )}

      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <p style={{ margin: 0, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1.5 }}>Hola, {user?.email}</p>
            <h1 style={{ marginTop: 8, fontSize: 32 }}>Bienvenido a tu panel de casilleros</h1>
          </div>
          <div style={{ padding: 16, borderRadius: 20, background: '#f8fafc', minWidth: 140, textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: '#6b7280' }}>Rol asignado</p>
            <strong>{user.role}</strong>
          </div>
        </div>

        {clientMode ? (
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ padding: 24, borderRadius: 24, background: '#fff', border: '1px solid #e5e7eb' }}>
              <h2>Mi casillero</h2>
              <p style={{ color: '#4b5563' }}>Aquí tienes el detalle de tu casillero y los artículos asociados.</p>
            </div>

            {lockers.length === 0 ? (
              <div style={{ padding: 24, borderRadius: 24, background: '#fff', border: '1px solid #e5e7eb' }}>
                <p style={{ margin: 0, color: '#6b7280' }}>Aún no hay un casillero asignado a este usuario.</p>
              </div>
            ) : (
              <>
                <div style={{ padding: 24, borderRadius: 24, background: '#fff', border: '1px solid #e5e7eb' }}>
                  <h3>Datos del casillero</h3>
                  <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                    <div><strong>Guía:</strong> {lockers[0].guideNumber}</div>
                    <div><strong>Fecha del casillero:</strong> {new Date(lockers[0].lockerDate).toLocaleDateString()}</div>
                    <div><strong>Estado:</strong> {lockers[0].status}</div>
                  </div>
                </div>

                <div style={{ padding: 24, borderRadius: 24, background: '#fff', border: '1px solid #e5e7eb' }}>
                  <h3>Artículos en tu casillero</h3>
                  {items.length === 0 ? (
                    <p style={{ color: '#6b7280' }}>No hay artículos registrados en este casillero.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', color: '#111827' }}>
                          <th style={{ padding: '12px 8px' }}>#</th>
                          <th style={{ padding: '12px 8px' }}>Tracking</th>
                          <th style={{ padding: '12px 8px' }}>Descripción</th>
                          <th style={{ padding: '12px 8px' }}>Modo</th>
                          <th style={{ padding: '12px 8px' }}>Costo estimado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={item.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '12px 8px' }}>{index + 1}</td>
                            <td style={{ padding: '12px 8px' }}>{item.trackingNumber}</td>
                            <td style={{ padding: '12px 8px' }}>{item.description}</td>
                            <td style={{ padding: '12px 8px' }}>{item.isAir ? 'Aéreo' : item.isSea ? 'Marítimo' : 'Local'}</td>
                            <td style={{ padding: '12px 8px' }}>${computeCost(item)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 24 }}>
            {selectedMenu === 'dashboard' && (
              <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                <div style={{ padding: 24, borderRadius: 24, background: '#fff', border: '1px solid #e5e7eb' }}>
                  <p style={{ margin: 0, color: '#6b7280' }}>Casilleros activos</p>
                  <strong style={{ fontSize: 32 }}>{summaries.totalCasilleros}</strong>
                </div>
                <div style={{ padding: 24, borderRadius: 24, background: '#fff', border: '1px solid #e5e7eb' }}>
                  <p style={{ margin: 0, color: '#6b7280' }}>Artículos registrados</p>
                  <strong style={{ fontSize: 32 }}>{summaries.totalArticulos}</strong>
                </div>
              </div>
            )}

            {selectedMenu === 'casilleros' && (
              <div style={{ display: 'grid', gap: 20 }}>
                <div style={{ padding: 24, borderRadius: 24, background: '#fff', border: '1px solid #e5e7eb' }}>
                  <h2>Artículos (detalle de casilleros)</h2>
                  <p style={{ color: '#4b5563' }}>Administra los artículos que pertenecen a cada casillero.</p>
                </div>

                <div style={{ padding: 24, borderRadius: 24, background: '#fff', border: '1px solid #e5e7eb' }}>
                  <h3>{editingItem ? 'Editar artículo' : 'Crear artículo'}</h3>
                  <form onSubmit={handleSubmitItem} style={{ display: 'grid', gap: 14, marginTop: 16 }}>
                    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
                      <input
                        value={itemForm.trackingNumber}
                        onChange={(e) => setItemForm({ ...itemForm, trackingNumber: e.target.value })}
                        placeholder="Tracking Number"
                        required
                        style={{ padding: 12, borderRadius: 12, border: '1px solid #d1d5db', width: '100%' }}
                      />
                      <input
                        value={itemForm.clientEmail}
                        onChange={(e) => setItemForm({ ...itemForm, clientEmail: e.target.value })}
                        placeholder="Email del casillero"
                        required
                        style={{ padding: 12, borderRadius: 12, border: '1px solid #d1d5db', width: '100%' }}
                      />
                    </div>
                    <input
                      value={itemForm.description}
                      onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                      placeholder="Descripción"
                      style={{ padding: 12, borderRadius: 12, border: '1px solid #d1d5db' }}
                    />

                    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                      <input
                        value={itemForm.length}
                        onChange={(e) => setItemForm({ ...itemForm, length: e.target.value })}
                        placeholder="Largo"
                        style={{ padding: 12, borderRadius: 12, border: '1px solid #d1d5db' }}
                      />
                      <input
                        value={itemForm.width}
                        onChange={(e) => setItemForm({ ...itemForm, width: e.target.value })}
                        placeholder="Ancho"
                        style={{ padding: 12, borderRadius: 12, border: '1px solid #d1d5db' }}
                      />
                      <input
                        value={itemForm.height}
                        onChange={(e) => setItemForm({ ...itemForm, height: e.target.value })}
                        placeholder="Alto"
                        style={{ padding: 12, borderRadius: 12, border: '1px solid #d1d5db' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                      <input
                        value={itemForm.weight}
                        onChange={(e) => setItemForm({ ...itemForm, weight: e.target.value })}
                        placeholder="Peso (kg)"
                        style={{ padding: 12, borderRadius: 12, border: '1px solid #d1d5db' }}
                      />
                      <input
                        value={itemForm.volume}
                        onChange={(e) => setItemForm({ ...itemForm, volume: e.target.value })}
                        placeholder="Volumen (m3)"
                        style={{ padding: 12, borderRadius: 12, border: '1px solid #d1d5db' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="checkbox" checked={itemForm.isAir} onChange={(e) => setItemForm({ ...itemForm, isAir: e.target.checked })} />
                          Aéreo
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="checkbox" checked={itemForm.isSea} onChange={(e) => setItemForm({ ...itemForm, isSea: e.target.checked })} />
                          Marítimo
                        </label>
                      </div>
                    </div>

                    {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <button type="submit" disabled={loading} style={{ padding: '12px 20px', borderRadius: 14, border: 'none', background: '#0f172a', color: '#fff', cursor: 'pointer' }}>
                        {editingItem ? 'Guardar cambios' : 'Crear artículo'}
                      </button>
                      {editingItem && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(null)
                            setItemForm({ ...emptyItemForm })
                          }}
                          style={{ padding: '12px 20px', borderRadius: 14, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div style={{ padding: 24, borderRadius: 24, background: '#fff', border: '1px solid #e5e7eb' }}>
                  <h3>Listado de artículos</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 14 }}>
                      <thead>
                        <tr style={{ textAlign: 'left', color: '#111827' }}>
                          <th style={{ padding: '12px 8px' }}>#</th>
                          <th style={{ padding: '12px 8px' }}>Tracking</th>
                          <th style={{ padding: '12px 8px' }}>Cliente</th>
                          <th style={{ padding: '12px 8px' }}>Descripción</th>
                          <th style={{ padding: '12px 8px' }}>Modo</th>
                          <th style={{ padding: '12px 8px' }}>Costo</th>
                          <th style={{ padding: '12px 8px' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={item.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '12px 8px' }}>{index + 1}</td>
                            <td style={{ padding: '12px 8px' }}>{item.trackingNumber}</td>
                            <td style={{ padding: '12px 8px' }}>{item.client?.email || item.clientEmail || 'Sin casillero'}</td>
                            <td style={{ padding: '12px 8px' }}>{item.description}</td>
                            <td style={{ padding: '12px 8px' }}>{item.isAir ? 'Aéreo' : item.isSea ? 'Marítimo' : 'Local'}</td>
                            <td style={{ padding: '12px 8px' }}>${computeCost(item)}</td>
                            <td style={{ padding: '12px 8px', display: 'flex', gap: 8 }}>
                              <button onClick={() => handleEditItem(item)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Editar</button>
                              <button onClick={() => handleDeleteItem(item.id)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #fca5a5', background: '#fef2f2', color: '#b91c1c', cursor: 'pointer' }}>Eliminar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {selectedMenu === 'clientes' && (
              <div style={{ display: 'grid', gap: 20 }}>
                <div style={{ padding: 24, borderRadius: 24, background: '#fff', border: '1px solid #e5e7eb' }}>
                  <h2>Casilleros</h2>
                  <p style={{ color: '#4b5563' }}>Administra los casilleros y sus datos de guía, fecha y estado.</p>
                </div>

                <div style={{ padding: 24, borderRadius: 24, background: '#fff', border: '1px solid #e5e7eb' }}>
                  <h3>{editingLocker ? 'Editar casillero' : 'Crear casillero'}</h3>
                  <form onSubmit={handleSubmitLocker} style={{ display: 'grid', gap: 14, marginTop: 16 }}>
                    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
                      <input
                        value={lockerForm.email}
                        onChange={(e) => setLockerForm({ ...lockerForm, email: e.target.value })}
                        placeholder="Email del casillero"
                        required
                        style={{ padding: 12, borderRadius: 12, border: '1px solid #d1d5db', width: '100%' }}
                      />
                      <input
                        value={lockerForm.name}
                        onChange={(e) => setLockerForm({ ...lockerForm, name: e.target.value })}
                        placeholder="Nombre del responsable"
                        style={{ padding: 12, borderRadius: 12, border: '1px solid #d1d5db', width: '100%' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                      <input
                        value={lockerForm.guideNumber}
                        onChange={(e) => setLockerForm({ ...lockerForm, guideNumber: e.target.value })}
                        placeholder="Número de guía"
                        required
                        style={{ padding: 12, borderRadius: 12, border: '1px solid #d1d5db' }}
                      />
                      <input
                        type="date"
                        value={lockerForm.lockerDate}
                        onChange={(e) => setLockerForm({ ...lockerForm, lockerDate: e.target.value })}
                        style={{ padding: 12, borderRadius: 12, border: '1px solid #d1d5db' }}
                      />
                      <select
                        value={lockerForm.status}
                        onChange={(e) => setLockerForm({ ...lockerForm, status: e.target.value as Status })}
                        style={{ padding: 12, borderRadius: 12, border: '1px solid #d1d5db' }}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="DISPATCHED">DISPATCHED</option>
                        <option value="DELIVERED">DELIVERED</option>
                      </select>
                    </div>

                    {lockerError && <div style={{ color: '#b91c1c' }}>{lockerError}</div>}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <button type="submit" disabled={loading} style={{ padding: '12px 20px', borderRadius: 14, border: 'none', background: '#0f172a', color: '#fff', cursor: 'pointer' }}>
                        {editingLocker ? 'Guardar casillero' : 'Crear casillero'}
                      </button>
                      {editingLocker && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLocker(null)
                            setLockerForm({ ...emptyLockerForm })
                          }}
                          style={{ padding: '12px 20px', borderRadius: 14, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div style={{ padding: 24, borderRadius: 24, background: '#fff', border: '1px solid #e5e7eb' }}>
                  <h3>Listado de casilleros</h3>
                  {lockers.length === 0 ? (
                    <p style={{ color: '#6b7280' }}>No hay casilleros registrados aún.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 14 }}>
                        <thead>
                          <tr style={{ textAlign: 'left', color: '#111827' }}>
                            <th style={{ padding: '12px 8px' }}>#</th>
                            <th style={{ padding: '12px 8px' }}>Email</th>
                            <th style={{ padding: '12px 8px' }}>Guía</th>
                            <th style={{ padding: '12px 8px' }}>Fecha</th>
                            <th style={{ padding: '12px 8px' }}>Estado</th>
                            <th style={{ padding: '12px 8px' }}>Artículos</th>
                            <th style={{ padding: '12px 8px' }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lockers.map((locker, index) => (
                            <tr key={locker.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '12px 8px' }}>{index + 1}</td>
                              <td style={{ padding: '12px 8px' }}>{locker.email}</td>
                              <td style={{ padding: '12px 8px' }}>{locker.guideNumber}</td>
                              <td style={{ padding: '12px 8px' }}>{new Date(locker.lockerDate).toLocaleDateString()}</td>
                              <td style={{ padding: '12px 8px' }}>{locker.status}</td>
                              <td style={{ padding: '12px 8px' }}>{locker.itemsCount}</td>
                              <td style={{ padding: '12px 8px', display: 'flex', gap: 8 }}>
                                <button onClick={() => handleEditLocker(locker)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Editar</button>
                                <button onClick={() => handleDeleteLocker(locker.id)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #fca5a5', background: '#fef2f2', color: '#b91c1c', cursor: 'pointer' }}>Eliminar</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedMenu === 'valores' && (
              <div style={{ padding: 24, borderRadius: 24, background: '#fff', border: '1px solid #e5e7eb' }}>
                <h2>Valores</h2>
                <p style={{ color: '#4b5563' }}>Tarifas estimadas por volumen y peso para los casilleros.</p>
                <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
                  <div style={{ padding: 20, borderRadius: 20, background: '#f8fafc' }}>
                    <strong>Base por peso</strong>
                    <p style={{ margin: '8px 0 0', color: '#4b5563' }}>2 USD por kg</p>
                  </div>
                  <div style={{ padding: 20, borderRadius: 20, background: '#f8fafc' }}>
                    <strong>Base por volumen</strong>
                    <p style={{ margin: '8px 0 0', color: '#4b5563' }}>100 USD por m³</p>
                  </div>
                  <div style={{ padding: 20, borderRadius: 20, background: '#f8fafc' }}>
                    <strong>Recargo aéreo</strong>
                    <p style={{ margin: '8px 0 0', color: '#4b5563' }}>+50%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
