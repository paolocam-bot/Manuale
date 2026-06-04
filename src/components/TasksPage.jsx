import React, { useEffect, useState } from 'react';

export default function TasksPage({ onCreateTask, onSelectTask }) {
  const [tasks, setTasks] = useState([]);
  const [issues, setIssues] = useState([]);

  const load = async () => {
    try {
      const db = await window.electronAPI.getData();
      setTasks(db.tasks || []);
      setIssues(db.issues || []);
    } catch (err) {
      console.error('Errore caricamento tasks', err);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleStatus = async (task) => {
    const updated = {
      ...task,
      status: task.status === 'conclusa' ? 'iniziata' : 'conclusa',
      closedAt: task.status === 'conclusa' ? null : new Date().toISOString(),
      archived: task.status !== 'conclusa'
    };
    await window.electronAPI.editTask(task.id, updated);
    await load();
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Eliminare la task?')) return;
    await window.electronAPI.deleteTask(taskId);
    await load();
  };

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2>Attività / Task</h2>
        <button className="btn btn-primary" onClick={onCreateTask}>Nuova Task</button>
      </div>

      {tasks.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>Nessuna attività.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tasks.map((t) => (
            <div 
              key={t.id} 
              onClick={() => onSelectTask?.(t.id)}
              style={{ 
                border: '1px solid var(--border-light)', 
                padding: 10, 
                borderRadius: 6, 
                display: 'flex', 
                justifyContent: 'space-between', 
                gap: 12,
                cursor: 'pointer',
                transition: 'border-color 0.2s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-indigo)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <strong>{t.branch}</strong>
                  <span style={{ color: t.status === 'conclusa' ? 'var(--accent-success)' : 'var(--text-secondary)' }}>{t.status}</span>
                  <small style={{ color: 'var(--text-secondary)' }}>{t.createdAt ? new Date(t.createdAt).toLocaleString() : ''}</small>
                </div>
                <div style={{ marginTop: 6 }}>{t.note}</div>
                {t.images?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {t.images.map((img, i) => (
                      <img key={img + i} src={`app-media://${img}`} alt="thumb" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4 }} />
                    ))}
                  </div>
                )}

                {t.issueId && (() => {
                  const linked = issues.find((x) => x.id === t.issueId);
                  return linked ? (
                    <div style={{ marginTop: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <strong>Problema collegato:</strong> {linked.title}
                      <div style={{ marginTop: 6 }}>
                        <em>Passi di risoluzione:</em>
                        <ol>
                          {(linked.resolutionSteps || linked.resolution?.split('\n')?.map((l) => ({ text: l })) || []).map((s, idx) => (
                            <li key={idx} style={{ marginTop: 4 }}>{s.text || s}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); toggleStatus(t); }}>{t.status === 'conclusa' ? 'Riapri' : 'Termina'}</button>
                <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); deleteTask(t.id); }}>Elimina</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
