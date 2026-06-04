import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import IssuesList from './components/IssuesList';
import IssueDetail from './components/IssueDetail';
import AddIssueForm from './components/AddIssueForm';
import AddCategoryModal from './components/AddCategoryModal';
import TasksPage from './components/TasksPage';
import NewTaskPage from './components/NewTaskPage';
import TaskDetail from './components/TaskDetail';
import { Search } from 'lucide-react';

export default function App() {
  const [categories, setCategories] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('list'); // 'list' | 'detail' | 'tasks' | 'task-detail' | 'new-task' | 'add-issue'
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Load database from Electron on mount
  useEffect(() => {
    async function loadData() {
      try {
        const data = await window.electronAPI.getData();
        setCategories(data.categories || []);
        setIssues(data.issues || []);
      } catch (err) {
        console.error('Errore nel caricamento del database:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter issues based on category and search query
  const filteredIssues = issues.filter((issue) => {
    const matchesCategory = selectedCategory === 'all' || issue.categoryId === selectedCategory;
    
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      issue.title.toLowerCase().includes(query) ||
      (issue.description && issue.description.toLowerCase().includes(query)) ||
      (issue.resolution && issue.resolution.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  // Get active issue details
  const selectedIssue = issues.find(i => i.id === selectedIssueId);

  // Get name of selected category
  const selectedCategoryName = selectedCategory === 'all' 
    ? 'Tutte le Categorie' 
    : categories.find(c => c.id === selectedCategory)?.name;

  // Add Category Handler
  const handleAddCategory = async (name) => {
    const updatedDb = await window.electronAPI.addCategory(name);
    setCategories(updatedDb.categories);
  };

  // Add Issue Handler
  const handleAddIssue = async (issueData) => {
    const updatedDb = await window.electronAPI.addIssue(issueData);
    setIssues(updatedDb.issues);
    setActiveView('list');
  };

  // Edit Issue Handler
  const handleEditIssue = async (issueData) => {
    const updatedDb = await window.electronAPI.editIssue(selectedIssueId, issueData);
    setIssues(updatedDb.issues);
    setActiveView('detail');
  };

  // Delete Issue Handler
  const handleDeleteIssue = async (id) => {
    const updatedDb = await window.electronAPI.deleteIssue(id);
    setIssues(updatedDb.issues);
    setActiveView('list');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-secondary)'
      }}>
        <div style={{
          border: '4px solid var(--border-light)',
          borderTop: '4px solid var(--accent-indigo)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <p style={{ fontWeight: 600, letterSpacing: '0.05em' }}>CARICAMENTO DATABASE...</p>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        categories={categories}
        issues={issues}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onAddCategoryClick={() => setIsCategoryModalOpen(true)}
        onViewChange={setActiveView}
      />

      {/* Main Panel */}
      <div className="main-content">
        <header className="main-header">
          {activeView === 'list' ? (
            <div className="search-container">
              <Search className="search-icon" size={18} />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Cerca per titolo, descrizione o parole chiave..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          ) : (
            <div style={{ height: '44px' }} /> /* spacer to preserve alignment */
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Stato Database: Connesso
            </span>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--accent-success)',
              boxShadow: '0 0 8px var(--accent-success)'
            }} />
          </div>
        </header>

        {/* Content Body */}
        <main className="content-body">
          {activeView === 'list' && (
            <IssuesList 
              issues={filteredIssues}
              categories={categories}
              onSelectIssue={(id) => {
                setSelectedIssueId(id);
                setActiveView('detail');
              }}
              onAddIssueClick={() => setActiveView('add-issue')}
              selectedCategoryName={selectedCategoryName}
            />
          )}

          {activeView === 'detail' && selectedIssue && (
            <IssueDetail 
              issue={selectedIssue}
              categories={categories}
              onBack={() => setActiveView('list')}
              onDelete={handleDeleteIssue}
              onEdit={() => setActiveView('edit-issue')}
            />
          )}

          {activeView === 'tasks' && (
            <TasksPage 
              onCreateTask={() => setActiveView('new-task')} 
              onSelectTask={(taskId) => {
                setSelectedTaskId(taskId);
                setActiveView('task-detail');
              }}
            />
          )}

          {activeView === 'task-detail' && selectedTaskId && (
            <TaskDetail 
              taskId={selectedTaskId}
              categories={categories}
              onBack={() => setActiveView('tasks')}
            />
          )}

          {activeView === 'new-task' && (
            <NewTaskPage onCancel={() => setActiveView('tasks')} onSaved={() => setActiveView('tasks')} />
          )}

          {activeView === 'add-issue' && (
            <AddIssueForm 
              categories={categories}
              onCancel={() => setActiveView('list')}
              onSave={handleAddIssue}
            />
          )}

          {activeView === 'edit-issue' && selectedIssue && (
            <AddIssueForm 
              categories={categories}
              onCancel={() => setActiveView('detail')}
              onSave={handleEditIssue}
              issueToEdit={selectedIssue}
            />
          )}
        </main>
      </div>

      {/* Add Category Dialog */}
      <AddCategoryModal 
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onAdd={handleAddCategory}
      />
    </div>
  );
}
