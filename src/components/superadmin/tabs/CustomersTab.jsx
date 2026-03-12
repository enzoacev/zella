import { useState } from 'react'
import { Btn, Badge, Inp, Modal, Confirm, SectionHeader } from '../../ui/primitives'
import { PinInput } from '../../ui/widgets'

const fmtD = s => s ? new Date(s).toLocaleDateString('es-AR') : '—'

const EMPTY = { name: '', dni: '', email: '', pin: '', birthDate: '' }

export default function CustomersTab({ store, toast }) {
  const [addModal,    setAddModal]    = useState(false)
  const [editModal,   setEditModal]   = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [form,        setForm]        = useState(EMPTY)
  const [editPin,     setEditPin]     = useState('')
  const [editing,     setEditing]     = useState(null)
  const [selected,    setSelected]    = useState(null)
  const [search,      setSearch]      = useState('')

  const filtered = store.customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dni.includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  const openEdit = c => {
    setEditing(c.id)
    setForm({ name: c.name, dni: c.dni, email: c.email || '', pin: '', birthDate: c.birthDate || '' })
    setEditPin('')
    setEditModal(true)
  }

  const openDetail = c => {
    setSelected(c)
    setDetailModal(true)
  }

  const handleAdd = () => {
    if (!form.name || !form.dni || form.pin.length !== 4) { toast('Nombre, DNI y PIN de 4 dígitos son requeridos', 'error'); return }
    if (store.customers.find(c => c.dni === form.dni)) { toast('Ya existe un socio con ese DNI', 'error'); return }
    store.addCustomer({ ...form, pin: form.pin })
    setAddModal(false)
    setForm(EMPTY)
    toast('Socio creado', 'success')
  }

  const handleEdit = () => {
    if (!form.name || !form.dni) { toast('Nombre y DNI son requeridos', 'error'); return }
    const updates = { name: form.name, dni: form.dni, email: form.email, birthDate: form.birthDate }
    if (editPin.length === 4) updates.pin = editPin
    store.updateCustomer(editing, updates)
    setEditModal(false)
    toast('Socio actualizado', 'success')
  }

  return (
    <div>
      <SectionHeader
        title="Socios"
        sub={`${store.customers.length} registrados`}
        action={<Btn onClick={() => { setForm(EMPTY); setAddModal(true) }}>+ Nuevo Socio</Btn>}
      />

      <div style={{ marginBottom: 16 }}>
        <input className="ifield" placeholder="🔍  Buscar por nombre, DNI o email..."
          value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 360 }} />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="ztable">
          <thead>
            <tr>
              <th>Socio</th>
              <th>DNI</th>
              <th>Email</th>
              <th>Nacimiento</th>
              <th>Alta</th>
              <th>Tarjetas</th>
              <th>Cupones</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const cards   = store.cards.filter(x => x.customerId === c.id)
              const coupons = store.coupons.filter(x => x.customerId === c.id && x.status === 'pending')
              return (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 11, background: 'linear-gradient(135deg,var(--p),var(--s))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 14, color: '#fff', flexShrink: 0 }}>
                        {c.name[0]}
                      </div>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                    </div>
                  </td>
                  <td><code style={{ fontSize: 12 }}>{c.dni}</code></td>
                  <td style={{ color: 'var(--mut)', fontSize: 12 }}>{c.email || '—'}</td>
                  <td style={{ color: 'var(--mut)', fontSize: 12 }}>{fmtD(c.birthDate)}</td>
                  <td style={{ color: 'var(--mut)', fontSize: 12 }}>{fmtD(c.joinDate)}</td>
                  <td><Badge color="var(--p)">{cards.length}</Badge></td>
                  <td><Badge color="#10B981">{coupons.length}</Badge></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <Btn sz="sm" v="g" onClick={() => openDetail(c)}>Ver</Btn>
                      <Btn sz="sm"      onClick={() => openEdit(c)}>Editar</Btn>
                      <Btn sz="sm" v="dan" onClick={() => { setEditing(c.id); setDeleteModal(true) }}>✕</Btn>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--mut)' }}>No se encontraron socios</div>
        )}
      </div>

      {/* ADD MODAL */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Nuevo Socio">
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="g2" style={{ gap: 12 }}>
            <Inp label="Nombre completo" value={form.name}      onChange={v => setForm(p => ({ ...p, name: v }))}      req />
            <Inp label="DNI"             value={form.dni}       onChange={v => setForm(p => ({ ...p, dni: v }))}       req />
            <Inp label="Email"    type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} />
            <Inp label="Fecha de nacimiento" type="date" value={form.birthDate} onChange={v => setForm(p => ({ ...p, birthDate: v }))} />
          </div>
          <PinInput value={form.pin} onChange={v => setForm(p => ({ ...p, pin: v }))} label="PIN de 4 dígitos *" />
          <Btn full onClick={handleAdd}>Crear Socio</Btn>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Editar Socio">
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="g2" style={{ gap: 12 }}>
            <Inp label="Nombre completo" value={form.name}  onChange={v => setForm(p => ({ ...p, name: v }))}  req />
            <Inp label="DNI"             value={form.dni}   onChange={v => setForm(p => ({ ...p, dni: v }))}   req />
            <Inp label="Email" type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} />
            <Inp label="Fecha de nacimiento" type="date" value={form.birthDate} onChange={v => setForm(p => ({ ...p, birthDate: v }))} />
          </div>
          <PinInput value={editPin} onChange={setEditPin} label="Nuevo PIN (dejar vacío para no cambiar)" />
          <Btn full onClick={handleEdit}>Guardar Cambios</Btn>
        </div>
      </Modal>

      {/* DETAIL MODAL */}
      {selected && (
        <Modal open={detailModal} onClose={() => setDetailModal(false)} title={`Detalle: ${selected.name}`} sz="lg">
          <CustomerDetail customer={selected} store={store} toast={toast} />
        </Modal>
      )}

      {/* DELETE CONFIRM */}
      <Confirm
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={() => { store.deleteCustomer(editing); toast('Socio eliminado', 'success') }}
        title="Eliminar Socio"
        message="Se eliminarán también todas sus tarjetas, cupones y transacciones. No se puede deshacer."
      />
    </div>
  )
}

// ─── Customer Detail ──────────────────────────────────────────────────────────
function CustomerDetail({ customer, store, toast }) {
  const cards   = store.cards.filter(c => c.customerId === customer.id)
  const coupons = store.coupons.filter(c => c.customerId === customer.id)
  const txs     = store.transactions.filter(t => t.customerId === customer.id)
  const fmtD = s => s ? new Date(s).toLocaleDateString('es-AR') : '—'

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Cards */}
      <div>
        <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
          Tarjetas de Fidelización ({cards.length})
        </p>
        {cards.map(card => {
          const m = store.merchants.find(x => x.id === card.merchantId)
          const pct = card.stamps / (m?.rules.stampsGoal || 1) * 100
          return (
            <div key={card.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--brd)' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 18 }}>{m?.branding.stampIcon}</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>{m?.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <div style={{ height: 4, width: 80, borderRadius: 99, background: 'var(--brd)' }}>
                      <div style={{ height: '100%', borderRadius: 99, background: m?.branding.primary || 'var(--p)', width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--mut)' }}>{card.stamps}/{m?.rules.stampsGoal}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Btn sz="sm" v="g" onClick={() => { store.addStamp(card.merchantId, customer.id, 1); toast('+1 sello manual', 'success') }}>+1</Btn>
                  <Btn sz="sm" v="dan" onClick={() => { store.deleteCard(card.id); toast('Tarjeta eliminada', 'success') }}>✕</Btn>
                </div>
              </div>
            </div>
          )
        })}
        {cards.length === 0 && <p style={{ color: 'var(--mut)', fontSize: 13 }}>Sin tarjetas</p>}
      </div>

      {/* Coupons */}
      <div>
        <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
          Cupones ({coupons.length})
        </p>
        {coupons.map(cp => {
          const m = store.merchants.find(x => x.id === cp.merchantId)
          const sColor = { pending: '#10B981', redeemed: '#6B7280', expired: '#EF4444' }[cp.status]
          return (
            <div key={cp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--brd)' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13 }}>{cp.rewardName}</p>
                <p style={{ fontSize: 11, color: 'var(--mut)' }}>{m?.name} · Vence {fmtD(cp.expiresAt)}</p>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Badge color={sColor}>{cp.status}</Badge>
                {cp.status === 'pending' && (
                  <Btn sz="sm" v="dan" onClick={() => { store.deleteCoupon(cp.id); toast('Cupón eliminado', 'success') }}>✕</Btn>
                )}
              </div>
            </div>
          )
        })}
        {coupons.length === 0 && <p style={{ color: 'var(--mut)', fontSize: 13 }}>Sin cupones</p>}
      </div>

      {/* Issue coupon */}
      <div style={{ padding: 16, borderRadius: 16, background: 'var(--bg)', border: '1px dashed var(--brd)' }}>
        <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Emitir cupón manual</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {store.merchants.map(m => (
            <Btn key={m.id} sz="sm" v="g" onClick={() => { store.issueCoupon(m.id, customer.id); toast(`Cupón emitido para ${m.name}`, 'success') }}>
              {m.branding.stampIcon} {m.name}
            </Btn>
          ))}
        </div>
      </div>
    </div>
  )
}
