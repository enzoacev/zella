import { useState } from 'react'
import { Btn, Badge, Inp, Sel, Modal, Confirm, SectionHeader } from '../../ui/primitives'
import { STAMP_ICONS, CATEGORIES } from '../../../data/initialData'

const fmtP = n => '$' + Math.round(n / 100).toLocaleString('es-AR')

const EMPTY_MERCHANT = {
  name: '', email: '', password: '', category: 'Cafetería',
  address: '', phone: '', planId: 'basic',
  branding: { primary: '#E6A540', secondary: '#1E1B18', stampIcon: '⭐', logoText: '' },
  rules: { stampsGoal: 10, rewardName: 'Premio Especial', couponValidity: 30 },
}

export default function MerchantsTab({ store, toast }) {
  const [addModal,    setAddModal]    = useState(false)
  const [editModal,   setEditModal]   = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [form,        setForm]        = useState(EMPTY_MERCHANT)
  const [editing,     setEditing]     = useState(null) // merchant id
  const [search,      setSearch]      = useState('')

  const filtered = store.merchants.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  )

  const openEdit = m => {
    setEditing(m.id)
    setForm({
      name: m.name, email: m.email, password: m.password,
      category: m.category, address: m.address || '', phone: m.phone || '',
      planId: m.planId,
      branding: { ...m.branding },
      rules: { ...m.rules },
    })
    setEditModal(true)
  }

  const handleSaveNew = () => {
    if (!form.name || !form.email || !form.password) { toast('Nombre, email y contraseña son requeridos', 'error'); return }
    store.addMerchant(form)
    setAddModal(false)
    setForm(EMPTY_MERCHANT)
    toast(`${form.name} creado`, 'success')
  }

  const handleSaveEdit = () => {
    if (!form.name || !form.email) { toast('Nombre y email son requeridos', 'error'); return }
    store.updateMerchant(editing, form)
    setEditModal(false)
    toast('Comercio actualizado', 'success')
  }

  const handleDelete = id => {
    store.deleteMerchant(id)
    toast('Comercio eliminado', 'success')
  }

  return (
    <div>
      <SectionHeader
        title="Comercios"
        sub={`${store.merchants.length} registrados · ${store.merchants.filter(m => m.active).length} activos`}
        action={<Btn onClick={() => { setForm(EMPTY_MERCHANT); setAddModal(true) }}>+ Nuevo Comercio</Btn>}
      />

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          className="ifield"
          placeholder="🔍  Buscar por nombre o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      {/* List */}
      <div style={{ display: 'grid', gap: 10 }}>
        {filtered.map((m, i) => {
          const pl = store.plans.find(p => p.id === m.planId)
          const mCards = store.cards.filter(c => c.merchantId === m.id)
          return (
            <div key={m.id} className="card fu" style={{ padding: '16px 22px', animationDelay: `${i * 45}ms` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 15, background: `linear-gradient(135deg,${m.branding.primary},${m.branding.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, flexShrink: 0 }}>
                    {m.branding.stampIcon}
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 15 }}>{m.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--mut)', marginBottom: 5 }}>{m.email} · {m.address}</p>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      <Badge color={pl?.color || '#6B7280'}>{pl?.name}</Badge>
                      <Badge color={m.active ? '#10B981' : '#EF4444'}>{m.active ? 'Activo' : 'Inactivo'}</Badge>
                      <Badge color="#6B7280">{mCards.length} socios</Badge>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right', marginRight: 8 }}>
                    <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 17 }}>
                      {fmtP(pl?.price || 0)}<span style={{ fontWeight: 400, fontSize: 11, color: 'var(--mut)' }}>/mes</span>
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--mut)' }}>Desde {m.joinDate}</p>
                  </div>
                  <Btn sz="sm" v="g" onClick={() => store.toggleMerchantActive(m.id)}>
                    {m.active ? 'Pausar' : 'Activar'}
                  </Btn>
                  <Btn sz="sm" onClick={() => openEdit(m)}>Editar</Btn>
                  <Btn sz="sm" v="dan" onClick={() => { setEditing(m.id); setDeleteModal(true) }}>✕</Btn>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="card" style={{ padding: 44, textAlign: 'center' }}>
            <p style={{ color: 'var(--mut)' }}>No se encontraron comercios</p>
          </div>
        )}
      </div>

      {/* ADD MODAL */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Nuevo Comercio" sz="lg">
        <MerchantForm form={form} setForm={setForm} plans={store.plans} isNew />
        <div style={{ marginTop: 20 }}>
          <Btn full onClick={handleSaveNew}>Crear Comercio</Btn>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Editar Comercio" sz="lg">
        <MerchantForm form={form} setForm={setForm} plans={store.plans} />
        <div style={{ marginTop: 20 }}>
          <Btn full onClick={handleSaveEdit}>Guardar Cambios</Btn>
        </div>
      </Modal>

      {/* DELETE CONFIRM */}
      <Confirm
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={() => handleDelete(editing)}
        title="Eliminar Comercio"
        message="Esta acción eliminará el comercio, todas sus tarjetas, cupones y transacciones. No se puede deshacer."
      />
    </div>
  )
}

// ─── Merchant Form (shared by add/edit) ────────────────────────────────────────
function MerchantForm({ form, setForm, plans, isNew }) {
  const upd   = patch => setForm(p => ({ ...p, ...patch }))
  const updBr = patch => setForm(p => ({ ...p, branding: { ...p.branding, ...patch } }))
  const updRl = patch => setForm(p => ({ ...p, rules: { ...p.rules, ...patch } }))

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Basic info */}
      <div>
        <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, marginBottom: 12, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Información General</p>
        <div className="g2" style={{ gap: 12 }}>
          <Inp label="Nombre del comercio" value={form.name}     onChange={v => upd({ name: v })}     req />
          <Sel label="Categoría" value={form.category} onChange={v => upd({ category: v })}
            options={CATEGORIES.map(c => ({ value: c, label: c }))} />
          <Inp label="Email"      value={form.email}    onChange={v => upd({ email: v })}    type="email" req />
          <Inp label={isNew ? 'Contraseña' : 'Nueva contraseña (dejar vacío para no cambiar)'}
            value={form.password} onChange={v => upd({ password: v })} type="password" req={isNew} />
          <Inp label="Dirección"  value={form.address}  onChange={v => upd({ address: v })} />
          <Inp label="Teléfono"   value={form.phone}    onChange={v => upd({ phone: v })} />
        </div>
      </div>

      {/* Plan */}
      <div>
        <span className="ilbl" style={{ marginBottom: 8 }}>Plan</span>
        <div style={{ display: 'flex', gap: 7 }}>
          {plans.map(pl => (
            <button key={pl.id} onClick={() => upd({ planId: pl.id })}
              style={{ flex: 1, padding: '9px 5px', borderRadius: 11, border: `2px solid ${form.planId === pl.id ? pl.color : 'var(--brd)'}`, background: form.planId === pl.id ? `color-mix(in srgb,${pl.color} 9%,transparent)` : 'transparent', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--txt)', transition: 'all .16s' }}>
              {pl.name}
            </button>
          ))}
        </div>
      </div>

      {/* Branding */}
      <div>
        <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, marginBottom: 12, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Branding</p>
        <div className="g2" style={{ gap: 12 }}>
          <div>
            <span className="ilbl">Color Principal</span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="color" value={form.branding.primary} onChange={e => updBr({ primary: e.target.value })}
                style={{ width: 48, height: 48, borderRadius: 12, border: '2px solid var(--brd)', cursor: 'pointer' }} />
              <code style={{ fontSize: 11, background: 'var(--bg)', padding: '5px 9px', borderRadius: 8 }}>{form.branding.primary}</code>
            </div>
          </div>
          <div>
            <span className="ilbl">Color Secundario</span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="color" value={form.branding.secondary} onChange={e => updBr({ secondary: e.target.value })}
                style={{ width: 48, height: 48, borderRadius: 12, border: '2px solid var(--brd)', cursor: 'pointer' }} />
              <code style={{ fontSize: 11, background: 'var(--bg)', padding: '5px 9px', borderRadius: 8 }}>{form.branding.secondary}</code>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <span className="ilbl" style={{ marginBottom: 8 }}>Ícono del Sello</span>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {STAMP_ICONS.map(ic => (
              <button key={ic} onClick={() => updBr({ stampIcon: ic })}
                style={{ width: 38, height: 38, borderRadius: 10, border: `2px solid ${form.branding.stampIcon === ic ? 'var(--p)' : 'var(--brd)'}`, background: form.branding.stampIcon === ic ? 'color-mix(in srgb,var(--p) 10%,transparent)' : 'transparent', fontSize: 16, cursor: 'pointer' }}>
                {ic}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rules */}
      <div>
        <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, marginBottom: 12, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Reglas de Negocio</p>
        <div className="g2" style={{ gap: 12 }}>
          <div>
            <span className="ilbl" style={{ marginBottom: 8 }}>Sellos para premio</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {[5, 8, 10, 12, 15, 20].map(n => (
                <button key={n} onClick={() => updRl({ stampsGoal: n })}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `2px solid ${form.rules.stampsGoal === n ? 'var(--p)' : 'var(--brd)'}`, background: form.rules.stampsGoal === n ? 'var(--p)' : 'transparent', color: form.rules.stampsGoal === n ? '#fff' : 'var(--txt)', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <Inp label="Nombre del premio" value={form.rules.rewardName} onChange={v => updRl({ rewardName: v })} />
          <div>
            <span className="ilbl" style={{ marginBottom: 8 }}>Validez cupón (días)</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {[7, 15, 30, 60, 90].map(n => (
                <button key={n} onClick={() => updRl({ couponValidity: n })}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `2px solid ${form.rules.couponValidity === n ? 'var(--p)' : 'var(--brd)'}`, background: form.rules.couponValidity === n ? 'var(--p)' : 'transparent', color: form.rules.couponValidity === n ? '#fff' : 'var(--txt)', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                  {n}d
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
