import React, { useEffect, useState } from 'react';

export default function NewTaskPage({ onCancel, onSaved }) {
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [issues, setIssues] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [branchModeNew, setBranchModeNew] = useState(false);
  const [form, setForm] = useState({ branch: '', categoryId: '', issueId: '', note: '', images: [], createdAt: '' });

  const load = async () => {
    try {
      const db = await window.electronAPI.getData();
      setCategories(db.categories || []);
      setBranches(db.branches || []);
      setIssues(db.issues || []);
    } catch (err) {
      console.error('Errore caricamento task data', err);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAddCategory = async () => {
    const name = prompt('Nome nuova categoria:');
    if (!name) return;
    try {
      await window.electronAPI.addCategory(name);
      await load();
    } catch (err) {
      alert(err.message || err);
    }
  };

  const handleAddBranch = async (name) => {
    if (!name) return;
    try {
      await window.electronAPI.addBranch(name);
      await load();
    } catch (err) {
      alert(err.message || err);
    }
  };

  const handleFilesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const uploaded = [];
    try {
      for (const file of files) {
        if (window.electronAPI.uploadImageFile) {
          const name = await window.electronAPI.uploadImageFile(file);
          uploaded.push(name);
        } else if (file.path) {
          const name = await window.electronAPI.uploadImage(file.path);
          uploaded.push(name);
        }
      }
      setForm((prev) => ({ ...prev, images: [...(prev.images || []), ...uploaded] }));
    } catch (err) {
      alert('Errore upload immagini: ' + (err.message || err));
    } finally {
      e.target.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.branch || !form.categoryId || !form.issueId) {
      alert('Compila filiale, categoria e problema');
      return;
    }

    setIsSaving(true);
    try {
      const payload = { ...form, createdAt: form.createdAt || new Date().toISOString(), status: 'iniziata', archived: false };
      await window.electronAPI.addTask(payload);
      setForm({ branch: '', categoryId: '', issueId: '', note: '', images: [], createdAt: '' });
      if (onSaved) onSaved();
    } catch (err) {
      alert(err.message || err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2>Nuova Task</h2>
        <button className="btn btn-secondary" onClick={onCancel}>Annulla</button>
      </div>

      <form onSubmit={handleSubmit} style={{ border: '1px solid var(--border-light)', padding: 12, borderRadius: 8 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {!branchModeNew ? (
            <>
              <select className="form-control" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} style={{ minWidth: 180 }}>
                <option value="">Seleziona filiale</option>
                {branches.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <button type="button" className="btn btn-secondary" onClick={() => setBranchModeNew(true)}>Aggiungi filiale</button>
            </>
          ) : (
            <>
              <input className="form-control" placeholder="Nuova filiale" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} style={{ minWidth: 180 }} />
              <button type="button" className="btn btn-secondary" onClick={() => { handleAddBranch(form.branch); setBranchModeNew(false); }}>Salva filiale</button>
              <button type="button" className="btn btn-outline" onClick={() => { setBranchModeNew(false); setForm({ ...form, branch: '' }); }}>Annulla</button>
            </>
          )}

          <select className="form-control" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">Seleziona categoria</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="button" className="btn btn-secondary" onClick={handleAddCategory}>Nuova categoria</button>

          <select className="form-control" value={form.issueId || ''} onChange={(e) => setForm({ ...form, issueId: e.target.value })}>
            <option value="">Seleziona problema</option>
            {issues.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
          </select>

          <input type="date" className="form-control" value={form.createdAt ? form.createdAt.split('T')[0] : ''} onChange={(e) => setForm({ ...form, createdAt: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
        </div>

        <textarea className="form-control" rows={3} placeholder="Note / richieste della filiale" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
          <input type="file" accept="image/*" multiple onChange={handleFilesChange} />
          {form.images?.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {form.images.map((img, idx) => (
                <img key={img + idx} src={`app-media://${img}`} alt="thumb" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          <button className="btn btn-primary" disabled={isSaving}>Salva Task</button>
        </div>
      </form>
    </div>
  );
}
