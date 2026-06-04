const { app, BrowserWindow, ipcMain, protocol, net, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Define app-media protocol
protocol.registerSchemesAsPrivileged([
  { scheme: 'app-media', privileges: { bypassCSP: true, secure: true, supportFetchAPI: true, stream: true } }
]);

let mainWindow;

// Paths
const baseDataPath = app.getPath('userData');
const dbPath = path.join(baseDataPath, 'db.json');
const imagesDirPath = path.join(baseDataPath, 'images');

// Create directories if they don't exist
if (!fs.existsSync(imagesDirPath)) {
  fs.mkdirSync(imagesDirPath, { recursive: true });
}

// Default Seed Data (IT Troubleshooting Manual)
const defaultData = {
  categories: [
    { id: 'stampanti', name: 'Stampanti' },
    { id: 'software', name: 'Software e Applicativi' },
    { id: 'rete', name: 'Connettività e Rete' },
    { id: 'hardware', name: 'Hardware e Periferiche' },
    { id: 'sicurezza', name: 'Sicurezza e Accessi' }
  ],
  issues: [
    {
    }
  ]
  ,
  types: [
    { id: 'generico', name: 'Generico' }
  ],
  branches: [],
  tasks: []
};

// Initialize DB file
function readDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const content = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading DB:', err);
    return defaultData;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing DB:', err);
    return false;
  }
}

// Window creation
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 850,
    minWidth: 900,
    minHeight: 650,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    },
    title: 'Manuale Risoluzione Problemi IT',
    autoHideMenuBar: true
  });

  // Load app
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

// Protocol registration
app.whenReady().then(() => {
  // Handle app-media protocol
  protocol.handle('app-media', (request) => {
    let fileName = decodeURIComponent(request.url.slice('app-media://'.length));
    // Strip trailing slash appended by the browser engine
    if (fileName.endsWith('/')) {
      fileName = fileName.slice(0, -1);
    }
    // Strip leading slash if present
    if (fileName.startsWith('/')) {
      fileName = fileName.slice(1);
    }
    const fileAbsolutePath = path.join(imagesDirPath, fileName);
    return net.fetch(url.pathToFileURL(fileAbsolutePath).toString());
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers

// Get all data
ipcMain.handle('get-data', async () => {
  return readDb();
});

// Add Category
ipcMain.handle('add-category', async (event, categoryName) => {
  const db = readDb();
  const id = categoryName.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  if (!id) throw new Error('Nome categoria non valido.');

  // Check if exists
  if (db.categories.find(c => c.id === id || c.name.toLowerCase() === categoryName.toLowerCase())) {
    throw new Error('La categoria esiste già.');
  }

  const newCategory = { id, name: categoryName };
  db.categories.push(newCategory);
  writeDb(db);
  return db;
});

// Add Issue
ipcMain.handle('add-issue', async (event, issueData) => {
  const db = readDb();
  const resolutionSteps = issueData.resolutionSteps || [];
  const allImages = resolutionSteps.flatMap(step => step.images || []);
  const newIssue = {
    id: Date.now().toString(),
    categoryId: issueData.categoryId,
    title: issueData.title,
    description: issueData.description,
    resolution: issueData.resolution || resolutionSteps.map(step => step.text).join('\n'),
    resolutionSteps,
    images: allImages
  };

  db.issues.push(newIssue);
  writeDb(db);
  return db;
});

// Edit Issue
ipcMain.handle('edit-issue', async (event, issueId, updatedData) => {
  const db = readDb();
  const index = db.issues.findIndex(i => i.id === issueId);
  if (index === -1) throw new Error('Problema non trovato.');

  const resolutionSteps = updatedData.resolutionSteps || [];
  const allImages = resolutionSteps.flatMap(step => step.images || []);

  db.issues[index] = {
    ...db.issues[index],
    categoryId: updatedData.categoryId,
    title: updatedData.title,
    description: updatedData.description,
    resolution: updatedData.resolution || resolutionSteps.map(step => step.text).join('\n'),
    resolutionSteps,
    images: allImages
  };

  writeDb(db);
  return db;
});

// Delete Issue
ipcMain.handle('delete-issue', async (event, issueId) => {
  const db = readDb();
  
  // Optional: Clean up associated image files from disk
  const issue = db.issues.find(i => i.id === issueId);
  if (issue && issue.images && issue.images.length > 0) {
    issue.images.forEach(imgName => {
      const imgPath = path.join(imagesDirPath, imgName);
      if (fs.existsSync(imgPath)) {
        try {
          fs.unlinkSync(imgPath);
        } catch (e) {
          console.error('Errore nella rimozione dell\'immagine:', e);
        }
      }
    });
  }

  db.issues = db.issues.filter(i => i.id !== issueId);
  writeDb(db);
  return db;
});

// Copy uploaded image to AppData
ipcMain.handle('upload-image', async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('Il file originale non esiste.');
    }

    if (!fs.existsSync(imagesDirPath)) {
      fs.mkdirSync(imagesDirPath, { recursive: true });
    }

    const extension = path.extname(filePath);
    const fileName = `img_${Date.now()}_${Math.floor(Math.random() * 1000)}${extension}`;
    const destinationPath = path.join(imagesDirPath, fileName);

    fs.copyFileSync(filePath, destinationPath);
    return fileName;
  } catch (err) {
    console.error('Errore nel caricamento dell\'immagine:', err);
    throw err;
  }
});

  // Add Task
  ipcMain.handle('add-task', async (event, taskData) => {
    const db = readDb();
    const newTask = {
      id: Date.now().toString(),
      branch: taskData.branch || '',
      categoryId: taskData.categoryId || '',
      issueId: taskData.issueId || null,
      typeId: taskData.typeId || '',
      status: taskData.status || 'iniziata',
      note: taskData.note || '',
      solution: taskData.solution || '',
      images: taskData.images || [],
      archived: !!taskData.archived,
      createdAt: taskData.createdAt || new Date().toISOString(),
      closedAt: taskData.closedAt || null
    };

    db.tasks = db.tasks || [];
    db.tasks.push(newTask);

    // add branch/type to lists if missing
    db.branches = db.branches || [];
    if (newTask.branch && !db.branches.includes(newTask.branch)) db.branches.push(newTask.branch);
    db.types = db.types || [];
    if (newTask.typeId && !db.types.find(t => t.id === newTask.typeId)) db.types.push({ id: newTask.typeId, name: newTask.typeId });

    writeDb(db);
    return db;
  });

  // Edit Task
  ipcMain.handle('edit-task', async (event, taskId, updatedData) => {
    const db = readDb();
    db.tasks = db.tasks || [];
    const idx = db.tasks.findIndex(t => t.id === taskId);
    if (idx === -1) throw new Error('Task non trovato');

    db.tasks[idx] = {
      ...db.tasks[idx],
      ...updatedData
    };

    // if status set to conclusa, mark archived
    if (db.tasks[idx].status === 'conclusa') db.tasks[idx].archived = true;

    writeDb(db);
    return db;
  });

  // Delete Task
  ipcMain.handle('delete-task', async (event, taskId) => {
    const db = readDb();
    db.tasks = db.tasks || [];
    db.tasks = db.tasks.filter(t => t.id !== taskId);
    writeDb(db);
    return db;
  });

  // Add Type
  ipcMain.handle('add-type', async (event, typeName) => {
    const db = readDb();
    const id = typeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (!db.types) db.types = [];
    if (db.types.find(t => t.id === id || t.name.toLowerCase() === typeName.toLowerCase())) {
      throw new Error('Tipo già esistente');
    }
    db.types.push({ id, name: typeName });
    writeDb(db);
    return db;
  });

  // Add Branch
  ipcMain.handle('add-branch', async (event, branchName) => {
    const db = readDb();
    db.branches = db.branches || [];
    if (!db.branches.includes(branchName)) db.branches.push(branchName);
    writeDb(db);
    return db;
  });

// Open external links (safely)
ipcMain.handle('open-external', async (event, url) => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    shell.openExternal(url);
  }
});
