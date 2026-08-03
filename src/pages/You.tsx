import { Shell } from '@/components/Shell';
import { useStore } from '@/context/StoreContext';
import { calcNumerology } from '@/lib/cosmic';
import { dateKey } from '@/lib/store';

export function YouPage() {
  const { user, logout, toast } = useStore();

  function exportJson() {
    if (!user) return;
    const payload = {
      name: user.name,
      profile: user.profile,
      ledger: user.ledger,
      notes: user.notes,
      numerology: calcNumerology(user.profile.dob, user.profile.fullName || user.name),
      exported: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gnostic_${user.name}_${dateKey()}.json`;
    a.click();
    toast('Exported');
  }

  return (
    <Shell>
      <h2>You</h2>
      <p className="sub">Local ledger · device only</p>
      <div className="gx-card" style={{ textAlign: 'center', padding: 28 }}>
        <div className="gx-avatar" style={{ width: 96, height: 96, fontSize: 32, marginBottom: 12 }}>
          {user?.avatar ? <img src={user.avatar} alt="" /> : (user?.name?.[0] || 'G')}
        </div>
        <h3 style={{ fontFamily: 'Poppins', fontSize: 24 }}>{user?.name}</h3>
        <p style={{ color: 'var(--ink-soft)', margin: '6px 0 16px' }}>
          {Object.keys(user?.ledger || {}).length} days · {(user?.notes || []).length} notes
        </p>
        <div className="gx-btn-row" style={{ justifyContent: 'center' }}>
          <button className="gx-btn gx-btn-primary" onClick={exportJson}>Export JSON</button>
          <button className="gx-btn gx-btn-ghost" onClick={logout}>Log out</button>
        </div>
      </div>
    </Shell>
  );
}
