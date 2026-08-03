import { useState } from 'react';
import { useStore } from '@/context/StoreContext';

export function AuthPage() {
  const { state, login, signup, toast } = useStore();
  const users = Object.values(state.users);
  const [pending, setPending] = useState<string | null>(null);
  const [pass, setPass] = useState('');
  const [mode, setMode] = useState<'roster' | 'signin' | 'signup'>('roster');
  const [name, setName] = useState('');
  const [newPass, setNewPass] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

  return (
    <div className="gx-auth">
      <div className="gx-auth-bg" />
      <div className="gx-auth-card">
        <h1>Gnostic<span>.</span></h1>
        <p style={{ textAlign: 'center', color: 'var(--ink-soft)', marginTop: 6, marginBottom: 8 }}>
          Spiritual diary · observed facts
        </p>

        {mode !== 'signin' && (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--teal-label)' }}>
              Login as
            </p>
            <div className="gx-user-grid">
              {users.length === 0 && (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13 }}>
                  No practitioners yet — create one below.
                </p>
              )}
              {users.map((u) => (
                <button
                  key={u.id}
                  className={`gx-user-tile ${pending === u.id ? 'on' : ''}`}
                  onClick={() => { setPending(u.id); setMode('signin'); setPass(''); }}
                >
                  <div className="gx-avatar">{u.avatar ? <img src={u.avatar} alt="" /> : u.name[0]}</div>
                  <small style={{ fontSize: 12 }}>{u.name}</small>
                </button>
              ))}
            </div>
          </>
        )}

        {mode === 'signin' && pending && (
          <>
            <div className="gx-field">
              <label>Password for {state.users[pending]?.name}</label>
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Your password" autoFocus />
            </div>
            <button
              className="gx-btn gx-btn-primary"
              style={{ width: '100%' }}
              onClick={() => {
                const err = login(pending, pass);
                if (err) toast(err);
              }}
            >
              Enter ledger
            </button>
            <button className="gx-btn gx-btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => { setMode('roster'); setPending(null); }}>
              Choose another
            </button>
          </>
        )}

        {mode !== 'signin' && (
          <>
            <div style={{ height: 1, background: 'rgba(23,24,28,.08)', margin: '16px 0' }} />
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--teal-label)', marginBottom: 10 }}>
              New practitioner
            </p>
            <div className="gx-field"><label>Name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" /></div>
            <div className="gx-field"><label>Password</label><input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Create a password" /></div>
            <div className="gx-field"><label>Photo</label><input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} /></div>
            <button
              className="gx-btn gx-btn-primary"
              style={{ width: '100%' }}
              onClick={async () => {
                const err = await signup(name, newPass, photo);
                if (err) toast(err);
              }}
            >
              Begin diary
            </button>
          </>
        )}
      </div>
    </div>
  );
}
