import React from 'react';
import { Image, ShieldAlert, Plus } from 'lucide-react';

export default function IssuesList({
  issues,
  categories,
  onSelectIssue,
  onAddIssueClick,
  selectedCategoryName
}) {
  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : 'Generico';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {selectedCategoryName || 'Tutti i Problemi'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            {issues.length} {issues.length === 1 ? 'problema registrato' : 'problemi registrati'}
          </p>
        </div>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={onAddIssueClick}>
          <Plus size={18} />
          Aggiungi Problema
        </button>
      </div>

      {issues.length === 0 ? (
        <div className="welcome-screen" style={{ marginTop: '40px' }}>
          <div className="welcome-icon-box">
            <ShieldAlert size={36} />
          </div>
          <h3 className="welcome-title">Nessun Risultato</h3>
          <p className="welcome-subtitle">
            Nessun elemento corrisponde ai filtri impostati. Crea un nuovo problema cliccando sul pulsante in alto a destra.
          </p>
        </div>
      ) : (
        <div className="issues-grid">
          {issues.map((issue) => (
            <div 
              key={issue.id} 
              className="issue-card"
              onClick={() => onSelectIssue(issue.id)}
            >
              <div className="issue-card-header">
                <span className="issue-badge">{getCategoryName(issue.categoryId)}</span>
                {issue.images && issue.images.length > 0 && (
                  <span className="issue-card-images-count" title={`${issue.images.length} allegati`}>
                    <Image size={14} style={{ color: 'var(--accent-cyan)' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {issue.images.length}
                    </span>
                  </span>
                )}
              </div>
              <h3 className="issue-card-title">{issue.title}</h3>
              <p className="issue-card-desc">{issue.description}</p>
              <div className="issue-card-footer">
                <span>Procedura risolutiva</span>
                <span style={{ color: 'var(--accent-indigo)', fontWeight: '600', fontSize: '0.85rem' }}>Visualizza →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
