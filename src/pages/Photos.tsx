import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { useStore } from '@/context/StoreContext';
import { fileToData, uid } from '@/lib/store';
import type { PhotoItem } from '@/lib/types';

const ENV_WEBHOOK = (import.meta.env.VITE_N8N_WEBHOOK_URL as string | undefined)?.trim() || '';

export function PhotosPage() {
  const { user, setPhotos, toast } = useStore();
  const photos = user?.photos || [];
  const inputRef = useRef<HTMLInputElement>(null);
  const [webhookDraft, setWebhookDraft] = useState(() => {
    try {
      return localStorage.getItem('gnostic_n8n_webhook') || ENV_WEBHOOK;
    } catch {
      return ENV_WEBHOOK;
    }
  });

  function saveWebhook(url: string) {
    setWebhookDraft(url);
    try {
      localStorage.setItem('gnostic_n8n_webhook', url);
    } catch { /* ignore */ }
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const next: PhotoItem[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = await fileToData(file);
      next.push({
        id: uid('ph'),
        name: file.name,
        dataUrl,
        mime: file.type,
        uploadedAt: Date.now(),
        status: 'idle',
      });
    }
    if (!next.length) {
      toast('Choose image files');
      return;
    }
    setPhotos([...next, ...photos]);
    toast(`Added ${next.length} photo(s)`);
  }

  async function analyze(id: string) {
    const photo = (user?.photos || []).find((p) => p.id === id);
    if (!photo) return;
    const url = webhookDraft.trim() || ENV_WEBHOOK;
    if (!url) {
      toast('Add n8n webhook URL first');
      return;
    }
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'uploading', error: undefined } : p)));
    try {
      // Temporarily patch env-less runtime URL into fetch
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'gnostic-photos',
          user: user?.name,
          photoId: photo.id,
          fileName: photo.name,
          mime: photo.mime,
          uploadedAt: photo.uploadedAt,
          imageBase64: photo.dataUrl,
        }),
      });
      const text = await res.text();
      let payload: unknown = text;
      try { payload = JSON.parse(text); } catch { /* keep */ }
      if (!res.ok) throw new Error(typeof payload === 'string' ? payload.slice(0, 160) : `HTTP ${res.status}`);
      setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'done', analysis: payload } : p)));
      toast('Analysis returned');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Webhook failed';
      setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'error', error: msg } : p)));
      toast(msg);
    }
  }

  function remove(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  const leftExtra = (
    <div className="gx-left-extra">
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', lineHeight: 1.45 }}>
        Photos POST to your n8n webhook as JSON (`imageBase64` + metadata). Response payload is stored locally.
      </p>
      <div className="gx-left-search">
        <input
          value={webhookDraft}
          onChange={(e) => saveWebhook(e.target.value)}
          placeholder="https://…/webhook/…"
        />
      </div>
    </div>
  );

  return (
    <Shell leftExtra={leftExtra}>
      <div className="gx-page">
        <div className="gx-page-head" style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <h2>Photos</h2>
            <p className="sub">Upload · send to n8n · review returned analysis.</p>
          </div>
          <button type="button" className="gx-btn gx-btn-primary" onClick={() => inputRef.current?.click()}>
            <ImagePlus size={16} /> Add photos
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }}
          />
        </div>

        <div className="photos-grid gx-fill">
          {photos.length === 0 && (
            <button type="button" className="gx-card photos-empty" onClick={() => inputRef.current?.click()}>
              <Upload size={28} />
              <strong>Drop or choose images</strong>
              <span>Sent to n8n for analysis when you tap Analyze</span>
            </button>
          )}
          {photos.map((p) => (
            <article key={p.id} className="photo-card">
              <div className="photo-thumb" style={{ backgroundImage: `url(${p.dataUrl})` }} />
              <div className="photo-meta">
                <strong>{p.name}</strong>
                <span>{new Date(p.uploadedAt).toLocaleString()}</span>
                <div className="gx-btn-row" style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className="gx-btn gx-btn-primary"
                    disabled={p.status === 'uploading'}
                    onClick={() => analyze(p.id)}
                  >
                    {p.status === 'uploading' ? <Loader2 size={14} className="spin" /> : null}
                    {p.status === 'uploading' ? 'Sending…' : 'Analyze'}
                  </button>
                  <button type="button" className="gx-btn gx-btn-ghost" onClick={() => remove(p.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
                {p.status === 'error' && <p className="photo-err">{p.error}</p>}
                {p.status === 'done' && p.analysis != null && (
                  <pre className="photo-payload">{typeof p.analysis === 'string' ? p.analysis : JSON.stringify(p.analysis, null, 2)}</pre>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </Shell>
  );
}
