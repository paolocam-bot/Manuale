const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getData: () => ipcRenderer.invoke('get-data'),
  addCategory: (categoryName) => ipcRenderer.invoke('add-category', categoryName),
  addIssue: (issueData) => ipcRenderer.invoke('add-issue', issueData),
  editIssue: (issueId, issueData) => ipcRenderer.invoke('edit-issue', issueId, issueData),
  deleteIssue: (issueId) => ipcRenderer.invoke('delete-issue', issueId),
  uploadImage: (filePath) => ipcRenderer.invoke('upload-image', filePath),
  uploadImageFile: (file) => {
    try {
      const nativePath = file.path;
      if (!nativePath) {
        throw new Error('Percorso file non disponibile. Usa un file input nativo di Electron.');
      }
      return ipcRenderer.invoke('upload-image', nativePath);
    } catch (err) {
      return Promise.reject(err);
    }
  },
  addTask: (taskData) => ipcRenderer.invoke('add-task', taskData),
  editTask: (taskId, taskData) => ipcRenderer.invoke('edit-task', taskId, taskData),
  deleteTask: (taskId) => ipcRenderer.invoke('delete-task', taskId),
  addType: (typeName) => ipcRenderer.invoke('add-type', typeName),
  addBranch: (branchName) => ipcRenderer.invoke('add-branch', branchName),
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});
