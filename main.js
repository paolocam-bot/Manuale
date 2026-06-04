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
const isDev = !app.isPackaged;
const baseDataPath = isDev 
  ? __dirname 
  : path.dirname(process.execPath);

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
      id: '1',
      categoryId: 'stampanti',
      title: 'Spooler di stampa bloccato',
      description: 'I documenti inviati alla stampante rimangono bloccati nello stato \'In coda\' o \'Eliminazione in corso\', bloccando ogni stampa successiva.',
      resolution: '1. Premi il tasto Windows + R, digita "services.msc" e premi Invio.\n2. Nella lista dei servizi, individua "Spooler di stampa" (Print Spooler).\n3. Fai click destro su di esso e seleziona "Arresta".\n4. Apri l\'Esplora File di Windows e vai alla cartella: C:\\Windows\\System32\\spool\\PRINTERS.\n5. Elimina tutti i file presenti all\'interno di questa cartella (non eliminare la cartella stessa!).\n6. Torna nella finestra dei Servizi, fai click destro su "Spooler di stampa" e seleziona "Avvia".\n7. Prova a lanciare una nuova stampa di prova.',
      images: []
    },
    {
      id: '2',
      categoryId: 'rete',
      title: 'Nessun accesso a Internet (DNS non risponde)',
      description: 'Il computer è connesso al Wi-Fi o alla rete cablata, ma i siti web non si caricano e compare l\'errore "DNS server not responding".',
      resolution: '1. Premi il tasto Windows + X e seleziona "Terminale" o "Prompt dei comandi" come Amministratore.\n2. Digita il comando "ipconfig /flushdns" e premi Invio per svuotare la cache DNS.\n3. Digita "ipconfig /release" seguito da "ipconfig /renew" per richiedere un nuovo indirizzo IP.\n4. Se il problema persiste, premi Windows + R, digita "ncpa.cpl" e primi Invio.\n5. Fai click destro sulla tua scheda di rete attiva e seleziona "Proprietà".\n6. Fai doppio click su "Protocollo Internet versione 4 (TCP/IPv4)".\n7. Seleziona "Utilizza i seguenti indirizzi server DNS" e inserisci:\n   - DNS Primario: 8.8.8.8 (DNS Google)\n   - DNS Secondario: 8.8.4.4\n8. Clicca su OK per confermare.',
      images: []
    },
    {
      id: '3',
      categoryId: 'software',
      title: 'Microsoft Outlook bloccato all\'avvio',
      description: 'All\'avvio, Microsoft Outlook si blocca sulla schermata di caricamento del profilo o va in crash immediato.',
      resolution: '1. Assicurati che Outlook sia completamente chiuso (controlla in Gestione Attività).\n2. Premi il tasto Windows + R, digita "outlook.exe /safe" (nota lo spazio prima della barra) e premi Invio.\n3. Se Outlook si avvia correttamente in modalità provvisoria, il problema è causato da un Add-in difettoso.\n4. All\'interno di Outlook, vai su File > Opzioni > Componenti aggiuntivi.\n5. In fondo alla pagina, seleziona "Componenti aggiuntivi COM" nel menu a discesa e clicca su "Vai...".\n6. Deseleziona tutti i componenti aggiuntivi attivi e clicca su OK.\n7. Riavvia Outlook in modalità normale e riabilita gli add-in uno alla volta per identificare quello problematico.',
      images: []
    }
  ]
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
  const newIssue = {
    id: Date.now().toString(),
    categoryId: issueData.categoryId,
    title: issueData.title,
    description: issueData.description,
    resolution: issueData.resolution,
    images: issueData.images || []
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

  db.issues[index] = {
    ...db.issues[index],
    categoryId: updatedData.categoryId,
    title: updatedData.title,
    description: updatedData.description,
    resolution: updatedData.resolution,
    images: updatedData.images || []
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

// Open external links (safely)
ipcMain.handle('open-external', async (event, url) => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    shell.openExternal(url);
  }
});
