import React, { useEffect, useState } from 'react';

export default function TaskDetail({ taskId, categories, onBack }) {
  const [task, setTask] = useState(null);
  const [issues, setIssues] = useState([]);
  const [noteDraft, setNoteDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadTask = async () => {
    setLoading(true);
    try {
      const db = await window.electronAPI.getData();
      const found = (db.tasks || []).find((t) => t.id === taskId);
      setTask(found || null);
      setIssues(db.issues || []);
      setNoteDraft(found?.note || '');
    } catch (err) {
      console.error('Errore caricamento task:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) loadTask();
  }, [taskId]);

  const handleSaveNote = async () => {
    if (!task) return;
    setSaving(true);
    try {
      await window.electronAPI.editTask(task.id, { note: noteDraft });
      setTask({ ...task, note: noteDraft });
      alert('Note salvate');
    } catch (err) {
      alert('Errore salvataggio note: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!task) return;
    setSaving(true);
    try {
      const updated = {
        status: task.status === 'conclusa' ? 'iniziata' : 'conclusa',
        closedAt: task.status === 'conclusa' ? null : new Date().toISOString(),
        archived: task.status !== 'conclusa',
      };
      await window.electronAPI.editTask(task.id, updated);
      setTask({ ...task, ...updated });
    } catch (err) {
      alert('Errore aggiornamento stato: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Caricamento task...</p>;
  }

  if (!task) {
    return (
      <div style={{ padding: 12 }}>
        <button className="btn btn-secondary" onClick={onBack}>Indietro</button>
        <p style={{ marginTop: 16 }}>Task non trovata.</p>
      </div>
    );
  }

  const linkedIssue = issues.find((i) => i.id === task.issueId);
  const categoryName = categories.find((c) => c.id === task.categoryId)?.name || 'Nessuna categoria';
  const resolutionSteps = linkedIssue?.resolutionSteps?.length > 0
    ? linkedIssue.resolutionSteps
    : linkedIssue?.resolution
      ? linkedIssue.resolution.split('\n').map((text, idx) => ({ text, images: idx === 0 ? linkedIssue.images || [] : [] }))
      : [];

  const cleanStepText = (stepStr) => {
    return stepStr?.replace(/^(?:\d+[\.\)]|[\-\*])\s*/, '') || '';
  };

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h2>Dettaglio Task</h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{task.branch} • {categoryName}</div>
        </div>
        <button className="btn btn-secondary" onClick={onBack}>Torna alle task</button>
      </div>

      <div style={{ border: '1px solid var(--border-light)', borderRadius: 10, padding: 14, display: 'grid', gap: 14 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>Stato:</span>
            <span style={{ color: task.status === 'conclusa' ? 'var(--accent-success)' : 'var(--accent-warning)' }}>{task.status}</span>
            <span style={{ color: 'var(--text-secondary)' }}>Creato: {task.createdAt ? new Date(task.createdAt).toLocaleString() : '-'}</span>
            {task.closedAt && <span style={{ color: 'var(--text-secondary)' }}>Chiuso: {new Date(task.closedAt).toLocaleString()}</span>}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleToggleStatus} disabled={saving}>
              {task.status === 'conclusa' ? 'Riapri task' : 'Concludi task'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Note interne</label>
          <textarea 
            className="form-control" 
            value={noteDraft} 
            onChange={(e) => setNoteDraft(e.target.value)}
            rows={6}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleSaveNote} disabled={saving}>Salva note</button>
            <span style={{ color: 'var(--text-secondary)' }}>Le note vengono salvate direttamente sulla task.</span>
          </div>
        </div>

        {task.images?.length > 0 && (
          <div style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontWeight: 600 }}>Allegate</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {task.images.map((img, idx) => (
                <img key={img + idx} src={`app-media://${img}`} alt={`task-${idx}`} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8 }} />
              ))}
            </div>
          </div>
        )}

        {linkedIssue && (
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 12, display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Problema collegato</strong>
              <span style={{ color: 'var(--text-secondary)' }}>ID: {linkedIssue.id}</span>
            </div>
            <div>
              <h3 style={{ margin: 0 }}>{linkedIssue.title}</h3>
              <p style={{ margin: '8px 0', color: 'var(--text-secondary)' }}>{linkedIssue.description}</p>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <span style={{ fontWeight: 600 }}>Passi di risoluzione</span>
              {resolutionSteps.length > 0 ? (
                <div style={{ display: 'grid', gap: 16 }}>
                  {resolutionSteps.map((step, idx) => (
                    <div key={idx} style={{ display: 'grid', gap: 8, padding: 12, border: '1px solid var(--border-light)', borderRadius: 8 }}>
                      <div style={{ fontWeight: 600 }}>Passo {idx + 1}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{cleanStepText(step.text || step)}</div>
                      {step.images?.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {step.images.map((imgName, imageIndex) => (
                            <img
                              key={imgName + imageIndex}
                              src={`app-media://${imgName}`}
                              alt={`Screenshot passo ${idx + 1}`}
                              style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8 }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div>Nessun passo disponibile.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
