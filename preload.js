const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getData: () => ipcRenderer.invoke('get-data'),
  addCategory: (categoryName) => ipcRenderer.invoke('add-category', categoryName),
  addIssue: (issueData) => ipcRenderer.invoke('add-issue', issueData),
  editIssue: (issueId, issueData) => ipcRenderer.invoke('edit-issue', issueId, issueData),
  deleteIssue: (issueId) => ipcRenderer.invoke('delete-issue', issueId),
  uploadImage: (filePath) => ipcRenderer.invoke('upload-image', filePath),
  uploadImageFile: (file) => {
    try {
      const nativePath = webUtils.getPathForFile(file);
      return ipcRenderer.invoke('upload-image', nativePath);
    } catch (err) {
      return Promise.reject(err);
    }
  },
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});
