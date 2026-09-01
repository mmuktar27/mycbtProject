const { app, BrowserWindow, dialog } = require('electron');
const express = require('express');
const path = require('path');
const fs = require('fs');
const { machineIdSync } = require('node-machine-id');
const crypto = require('crypto');
let mainWindow;
let server;

function createWindow() {
  // Get the primary display's work area size
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    autoHideMenuBar: true,
    useContentSize: true,
    resizable: true, // Allow resizing for responsiveness
    show: false,
    // Remove fullscreen: true
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Maximize the window when it's ready
  mainWindow.maximize();

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on('ready', () => {
    console.log('\n' + '='.repeat(60));
    console.log('MYCBT APPLICATION STARTING');
    console.log('='.repeat(60));
    startServer();
  });
}

function getPortableAppPath() {
  const isDev = !app.isPackaged;
  
  if (isDev) {
    return __dirname;
  } else {
    // Get directory where the .exe is located
    return path.dirname(app.getPath('exe'));
  }
}

function getResourcesPath() {
  const isDev = !app.isPackaged;
  
  if (isDev) {
    return path.join(__dirname, 'resources');
  } else {
    // In production, ALWAYS use process.resourcesPath first
    const primaryPath = path.join(process.resourcesPath, 'resources');
    
    console.log('Checking primary resources path:', primaryPath);
    console.log('Primary path exists:', fs.existsSync(primaryPath));
    
    if (fs.existsSync(primaryPath)) {
      return primaryPath;
    }
    
    // Fallback to exe directory
    const appPath = getPortableAppPath();
    const fallbackPath = path.join(appPath, 'resources');
    
    console.log('Using fallback path:', fallbackPath);
    return fallbackPath;
  }
}

function createDefaultDatabase(dbPath, dbName) {
  console.log(`Creating default ${dbName}...`);
  const Database = require('better-sqlite3');
  
  if (dbName === 'candidates.db') {
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.exec(`CREATE TABLE IF NOT EXISTS candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        candregno TEXT,
        fullname TEXT,
        img TEXT,
        subj1 TEXT,
        subj2 TEXT,
        subj3 TEXT
    )`);
    db.close();
    console.log(`✅ Created default ${dbName}`);
  } else if (dbName === 'questions.db') {
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    // Create basic structure - you can add more tables as needed
    db.exec(`CREATE TABLE IF NOT EXISTS question (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subjID TEXT,
        question TEXT,
        optionA TEXT,
        optionB TEXT,
        optionC TEXT,
        optionD TEXT,
        answer TEXT
    )`);
    db.exec(`CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subj TEXT,
        subjID TEXT
    )`);
    db.exec(`CREATE TABLE IF NOT EXISTS answered (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        qid INTEGER,
        canid TEXT,
        subjid TEXT,
        examID TEXT,
        selectedOption TEXT
    )`);
    db.exec(`CREATE TABLE IF NOT EXISTS exams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        examID TEXT,
        timeElapse INTEGER,
        candID TEXT,
        status TEXT
    )`);
    db.exec(`CREATE TABLE IF NOT EXISTS challenges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        challengeID TEXT,
        title TEXT,
        description TEXT
    )`);
    db.exec(`CREATE TABLE IF NOT EXISTS completedChallenges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        candID TEXT,
        challengeID TEXT,
        completionDate TEXT
    )`);
    db.close();
    console.log(`✅ Created default ${dbName} with tables`);
  }
}

function ensureDatabaseExists(dbFileName) {
  const appPath = getPortableAppPath();
  const workingDbPath = path.join(appPath, dbFileName);
  
  console.log(`\nChecking database: ${dbFileName}`);
  console.log(`Working DB Path: ${workingDbPath}`);
  
  // If working database already exists, use it
  if (fs.existsSync(workingDbPath)) {
    console.log(`✅ Working database exists`);
    return workingDbPath;
  }

  // Try to copy from resources folder (template)
  const resourcesPath = getResourcesPath();
  const templateDbPath = path.join(resourcesPath, dbFileName);
  
  console.log(`Template DB Path: ${templateDbPath}`);
  
  if (fs.existsSync(templateDbPath)) {
    try {
      fs.copyFileSync(templateDbPath, workingDbPath);
      console.log(`✅ Copied ${dbFileName} from template`);
      return workingDbPath;
    } catch (err) {
      console.error(`❌ Error copying ${dbFileName}:`, err.message);
    }
  } else {
    console.warn(`⚠️  Template database not found at: ${templateDbPath}`);
  }

  // If no template found, create a new default database
  try {
    createDefaultDatabase(workingDbPath, dbFileName);
    return workingDbPath;
  } catch (err) {
    console.error(`❌ Error creating default database:`, err.message);
    throw err;
  }
}
const ACTIVATION_SECRET = 'MYCBT_SECRET_SALT_2024_SECURE_KEY';
const ADMIN_PASSWORD = 'Admin@2024'; // Change this!
function startServer() {
  const Database = require('better-sqlite3');
  const bodyParser = require('body-parser');
  const cors = require('cors');
  const serVer = express();
  
  const port = 8088;
  const isDev = !app.isPackaged;
  
  console.log('\nEnvironment:', isDev ? 'Development' : 'Production (Portable)');
  console.log('Exe Path:', app.getPath('exe'));
  console.log('App Path:', getPortableAppPath());
  console.log('Resources Path:', getResourcesPath());

  // Get build folder path
  let buildPath;
  if (isDev) {
    buildPath = path.join(__dirname, 'build');
  } else {
    buildPath = path.join(__dirname, 'build');
    
    if (!fs.existsSync(buildPath)) {
      const altPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'build');
      if (fs.existsSync(altPath)) {
        buildPath = altPath;
      }
    }
  }

  console.log('\nBuild Path:', buildPath);
  console.log('Build exists:', fs.existsSync(buildPath));

  if (!fs.existsSync(buildPath)) {
    console.error('❌ Build folder not found!');
    dialog.showErrorBox('Error', 'Application build files not found.');
    app.quit();
    return;
  }

  // Initialize databases
  let db, qdb,actdb;
  
  try {
    console.log('\n' + '-'.repeat(60));
    console.log('INITIALIZING DATABASES');
    console.log('-'.repeat(60));
    
    const dbPath = ensureDatabaseExists('candidates.db');
    const qdbPath = ensureDatabaseExists('questions.db');
    const actdbPath = ensureDatabaseExists('activations.db');
    
    console.log('\nFinal DB Paths:');
    console.log('Candidates DB:', dbPath);
    console.log('Questions DB:', qdbPath);
    
    console.log('\nConnecting to databases...');
    db = new Database(dbPath);
    console.log('✅ Connected to candidates database');
    db.pragma('journal_mode = WAL');
    
    // Ensure tables exist
    db.exec(`CREATE TABLE IF NOT EXISTS candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        candregno TEXT,
        fullname TEXT,
        img TEXT,
        subj1 TEXT,
        subj2 TEXT,
        subj3 TEXT
    )`);
    

  actdb = new Database(actdbPath);
    console.log('✅ Connected to activation database');
    actdb.pragma('journal_mode = WAL');



// Create activation tables when server starts
actdb.exec(`CREATE TABLE IF NOT EXISTS admin_activations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    systemId TEXT UNIQUE NOT NULL,
    activationKey TEXT NOT NULL,
    generatedAt TEXT NOT NULL,
    generatedBy TEXT DEFAULT 'admin',
    status TEXT DEFAULT 'pending'
)`);

actdb.exec(`CREATE TABLE IF NOT EXISTS user_activations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    systemId TEXT UNIQUE NOT NULL,
    activationKey TEXT NOT NULL,
    activatedAt TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    lastChecked TEXT
)`);

console.log('✅ Activation tables created');



    qdb = new Database(qdbPath);
    console.log('✅ Connected to questions database');
    qdb.pragma('journal_mode = WAL');
    
    // Verify tables
    try {
      const tables = qdb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      console.log('✅ Available tables:', tables.map(t => t.name).join(', '));
      
      if (tables.length === 0) {
        console.warn('⚠️  No tables found, creating default structure...');
        createDefaultDatabase(qdbPath, 'questions.db');
      }
    } catch (err) {
      console.warn('⚠️  Could not list tables:', err.message);
    }
    
    console.log('-'.repeat(60));
    
  } catch (err) {
    console.error('\n❌ DATABASE INITIALIZATION FAILED');
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    
    dialog.showErrorBox('Database Error', 
      `Failed to initialize databases:\n\n${err.message}\n\nThe application will now close.`
    );
    
    app.quit();
    return;
  }

  serVer.use(express.json({ limit: '50mb' }));
  serVer.use(express.urlencoded({ limit: '50mb', extended: true }));
  serVer.use(bodyParser.json());
  serVer.use(cors());
  serVer.use(express.static(buildPath));

  // Health check endpoint
  serVer.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: Date.now() });
  });

  // API Routes
  serVer.get('/api/candidates', (req, res) => {
      try {
          const rows = db.prepare('SELECT * FROM candidates').all();
          res.json(rows);
      } catch (err) {
          console.error('Error getting candidates:', err.message);
          res.status(500).json({ error: 'Internal server error' });
      }
  });

  serVer.post('/api/candidates', (req, res) => {
      try {
          const { candregno, fullname, img } = req.body;
          const stmt = db.prepare('INSERT INTO candidates (candregno, fullname, img) VALUES (?, ?, ?)');
          const result = stmt.run(candregno, fullname, img);
          res.json({ id: result.lastInsertRowid });
      } catch (err) {
          console.error('Error adding candidate:', err.message);
          res.status(500).json({ error: 'Internal server error' });
      }
  });

  serVer.post('/api/check-candidate', async (req, res) => {
      const { regNo } = req.body;
      try {
          const row = db.prepare('SELECT * FROM candidates WHERE candregno = ?').get(regNo);
          res.json({ exists: !!row });
      } catch (error) {
          console.error('Error checking candidate in DB:', error);
          res.status(500).json({ error: 'Internal Server Error' });
      }
  });

  serVer.get('/api/get-candidate/:regNo', (req, res) => {
      try {
          const regNo = req.params.regNo;
          const row = db.prepare('SELECT * FROM candidates WHERE candregno = ?').get(regNo);
          res.json(row);
      } catch (err) {
          console.error('Error getting candidate:', err.message);
          res.status(500).json({ error: 'Internal server error' });
      }
  });

  serVer.get('/api/exam-question', (req, res) => {
      try {
          const rows = qdb.prepare('SELECT * FROM question WHERE subjID in ("ENG","BIO","CHEM","PHY")').all();
          res.json(rows);
      } catch (err) {
          console.error('Error getting questions:', err.message);
          res.status(500).json({ error: 'Internal server error' });
      }
  });

  serVer.get('/api/exam-questions/:regNo', (req, res) => {
      try {
          const regNo = req.params.regNo;
          const candidateData = db.prepare('SELECT subj1, subj2, subj3 FROM candidates WHERE candregno = ?').get(regNo);
          
          if (!candidateData) {
              return res.status(404).json({ error: 'Candidate not found' });
          }

          const subjectRows = qdb.prepare('SELECT subj, subjID FROM subjects WHERE subjID IN (?,?,?,?)').all("ENG", candidateData.subj1, candidateData.subj2, candidateData.subj3);
          const questionRows = qdb.prepare('SELECT * FROM question WHERE subjID IN (?,?,?,?)').all("ENG", candidateData.subj1, candidateData.subj2, candidateData.subj3);
          
          const responseData = {
              candidateSubjects: subjectRows,
              questions: questionRows
          };
          res.json(responseData);
      } catch (err) {
          console.error('Error getting exam questions:', err.message);
          res.status(500).json({ error: 'Internal server error' });
      }
  });

  serVer.post('/api/saveAnswer', (req, res) => {
      try {
          const { qid, canid, subjid, examID, selectedOption } = req.body;
          const stmt = qdb.prepare('INSERT INTO answered (qid, canid, subjid, examID, selectedOption) VALUES (?, ?, ?, ?, ?)');
          stmt.run(qid, canid, subjid, examID, selectedOption);
          res.send('Selected option saved successfully');
      } catch (err) {
          console.error('Error saving selected option:', err.message);
          res.status(500).send('Error saving selected option');
      }
  });

  
serVer.get('/api/exam-results/:examID/:candID', (req, res) => {
    try {
        const { examID, candID } = req.params;
        
        console.log('Fetching exam results for:', { examID, candID });
        
        // Step 1: Get all answered questions for this exam
        const answeredQuestions = qdb.prepare(`
            SELECT 
                qid,
                subjid,
                selectedOption
            FROM answered 
            WHERE examID = ? AND canid = ?
        `).all(examID, candID);
        
        if (answeredQuestions.length === 0) {
            return res.status(404).json({ 
                message: 'No results found for this exam',
                results: [],
                questions: []
            });
        }
        
        // Step 2: Get the candidate's subjects
        const candidate = db.prepare(`
            SELECT subj1, subj2, subj3 
            FROM candidates 
            WHERE candregno = ?
        `).get(candID);
        
        if (!candidate) {
            return res.status(404).json({ 
                message: 'Candidate not found',
                results: [],
                questions: []
            });
        }
        
        // Step 3: Get all questions for this candidate's subjects (including ENG)
        const allQuestions = qdb.prepare(`
            SELECT * 
            FROM question 
            WHERE subjID IN (?, ?, ?, ?)
        `).all("ENG", candidate.subj1, candidate.subj2, candidate.subj3);
        
        // Step 4: Build results array with grades
        const results = answeredQuestions.map(answer => {
            // Find the corresponding question
            const question = allQuestions.find(q => q.id === answer.qid);
            
            // Calculate grade (1 if correct, 0 if wrong)
            const grade = question && question.answer === answer.selectedOption ? 1 : 0;
            
            return {
                qid: answer.qid,
                subjid: answer.subjid,
                selectedoption: answer.selectedOption,
                grade: grade
            };
        });
        
        console.log(`Retrieved ${results.length} results and ${allQuestions.length} questions`);
        
        res.json({
            results: results,
            questions: allQuestions
        });
        
    } catch (err) {
        console.error('Error fetching exam results:', err.message);
        res.status(500).json({ 
            error: 'Failed to fetch exam results',
            message: err.message,
            results: [],
            questions: []
        });
    }
});
  serVer.put('/api/updateAnswer', (req, res) => {
      try {
          const { qid, canid, subjid, examID, selectedOption } = req.body;
          const stmt = qdb.prepare('UPDATE answered SET selectedOption = ? WHERE qid = ? AND canid = ? AND subjid = ? AND examID = ?');
          stmt.run(selectedOption, qid, canid, subjid, examID);
          res.send('Selected option updated successfully');
      } catch (err) {
          console.error('Error updating selected option:', err.message);
          res.status(500).send('Error updating selected option');
      }
  });

  serVer.get('/api/checkAnswer/:questionId/:candid/:subjId/:examID', (req, res) => {
      try {
          const { questionId, candid, subjId, examID } = req.params;
          const row = qdb.prepare('SELECT * FROM answered WHERE qid = ? AND canid = ? AND subjid = ? AND examID = ?').get(questionId, candid, subjId, examID);
          res.json(row || null);
      } catch (err) {
          console.error('Error checking existing answer:', err.message);
          res.status(500).send('Error checking existing answer');
      }
  });

  serVer.put('/api/saveAnswer/:id', (req, res) => {
      try {
          const { id } = req.params;
          const { selectedOption } = req.body;
          const stmt = qdb.prepare('UPDATE answered SET selectedOption = ? WHERE id = ?');
          stmt.run(selectedOption, id);
          res.send('Selected option updated successfully');
      } catch (err) {
          console.error('Error updating selected option:', err.message);
          res.status(500).send('Error updating selected option');
      }
  });

  serVer.get('/api/getAnswer/:examID/:regNo', (req, res) => {
      try {
          const { examID, regNo } = req.params;
          const rows = qdb.prepare('SELECT selectedOption, subjid, qid FROM answered WHERE examID = ? AND canid = ?').all(examID, regNo);
          res.json(rows);
      } catch (err) {
          console.error('Error retrieving selected options:', err.message);
          res.status(500).send('Error retrieving selected options');
      }
  });

  serVer.get('/api/getTimerState', (req, res) => {
      try {
          const { examID, regNo } = req.query;
          const row = qdb.prepare('SELECT timeElapse FROM exams WHERE examID = ? AND candID = ?').get(examID, regNo);
          const timeElapsed = row ? row.timeElapse : null;
          res.json({ timeElapsed });
      } catch (err) {
          console.error('Error retrieving timer state:', err.message);
          res.status(500).send('Error retrieving timer state');
      }
  });

  serVer.get('/api/gettimeCount/:examID/:regNo', (req, res) => {
      try {
          const { examID, regNo } = req.params;
          const row = qdb.prepare('SELECT timeElapse FROM exams WHERE examID = ? AND candID = ?').get(examID, regNo);
          const timeElapsed = row ? row.timeElapse : null;
          res.json({ timeElapsed });
      } catch (err) {
          console.error('Error retrieving timer state:', err.message);
          res.status(500).send('Error retrieving timer state');
      }
  });

  serVer.put('/api/updateTimerState', (req, res) => {
      try {
          const { newTimeElapsed, status, examID, regNo } = req.body;
          let stmt;
          if (status === "Elapsed" || status === "Submitted") {
              stmt = qdb.prepare("UPDATE exams SET timeElapse = ?, status = ? WHERE examID = ? AND candID = ?");
              stmt.run(newTimeElapsed, status, examID, regNo);
          } else {
              stmt = qdb.prepare("UPDATE exams SET timeElapse = ? WHERE examID = ? AND candID = ?");
              stmt.run(newTimeElapsed, examID, regNo);
          }
          res.sendStatus(200);
      } catch (err) {
          console.error('Error updating timer state:', err.message);
          res.status(500).send('Error updating timer state');
      }
  });


serVer.post('/api/submitRegFormData', (req, res) => {
    try {
        const formData = req.body;

        console.log("➡️ Incoming registration:", formData);

        // --- Validate required fields ---
        const requiredFields = ['candregno', 'fullname', 'img', 'subj1', 'subj2', 'subj3'];
        const missing = requiredFields.filter(f => {
            const v = formData[f];
            return v === undefined || v === null || v.toString().trim() === "";
        });

        if (missing.length > 0) {
            console.warn("⚠️ Missing fields:", missing);
            return res.status(400).json({
                message: 'Missing required fields',
                missingFields: missing
            });
        }

        const { candregno, fullname, img, subj1, subj2, subj3 } = formData;

        // --- Check duplicate reg number ---
        const exists = db
            .prepare('SELECT 1 FROM candidates WHERE candregno = ? LIMIT 1')
            .get(candregno);

        if (exists) {
            console.warn(`❌ Duplicate entry blocked: ${candregno}`);
            return res.status(409).json({
                message: 'Duplicate registration number. Candidate already exists.',
                duplicate: true
            });
        }

        // --- Insert candidate ---
        const insertStmt = db.prepare(
            `INSERT INTO candidates 
            (candregno, fullname, img, subj1, subj2, subj3) 
            VALUES (?, ?, ?, ?, ?, ?)`
        );

        const result = insertStmt.run(candregno, fullname, img, subj1, subj2, subj3);

        console.log("✅ Insert successful:", result.lastInsertRowid);

        return res.status(200).json({
            message: 'Form data submitted successfully',
            insertId: result.lastInsertRowid,
            formData
        });

    } catch (err) {
        console.error("❌ Server error:", err);
        return res.status(500).json({
            message: 'Error submitting form data',
            error: err.message
        });
    }
});

  serVer.post('/api/createexams', (req, res) => {
      try {
          const { examID, candID, status, timeElapse } = req.body;
          const stmt = qdb.prepare('INSERT INTO exams (examID, timeElapse, candID, status) VALUES (?, ?, ?, ?)');
          stmt.run(examID, timeElapse, candID, status);
          res.status(200).json({ message: 'Form data submitted successfully' });
      } catch (err) {
          console.error('Error inserting form data into database:', err.message);
          res.status(500).json({ message: 'Error submitting form data' });
      }
  });

  serVer.get('/api/checkexams/:regNo', (req, res) => {
      try {
          const { regNo } = req.params;
          const row = qdb.prepare('SELECT examID FROM exams WHERE status = ? AND candID = ?').get('Ongoing', regNo);
          const examID = row ? row.examID : null;
          res.json({ examID });
      } catch (err) {
          console.error('Error retrieving exam:', err);
          res.status(500).json({ error: 'Error retrieving exam' });
      }
  });

  serVer.get('/api/checkcandidate/:regNo', (req, res) => {
      try {
          const { regNo } = req.params;
          const row = db.prepare('SELECT * FROM candidates WHERE candregno = ?').get(regNo);
          const candid = row ? row.candregno : null;
          res.json({ candid });
      } catch (err) {
          console.error('Error retrieving cand:', err);
          res.status(500).json({ error: 'Error retrieving cand' });
      }
  });

  serVer.get('/api/getexams/:regNo', (req, res) => {
      try {
          const { regNo } = req.params;
          const row = qdb.prepare('SELECT * FROM exams WHERE candID = ?').all(regNo);
          res.json({ row });
      } catch (err) {
          console.error('Error retrieving exams:', err);
          res.status(500).json({ error: 'Error retrieving exams' });
      }
  });

  serVer.get('/api/challenges', (req, res) => {
      try {
          const row = qdb.prepare('SELECT * FROM challenges').all();
          res.json({ row });
      } catch (err) {
          console.error('Error retrieving challenges:', err);
          res.status(500).json({ error: 'Error retrieving challenges' });
      }
  });

  serVer.get('/api/completedchallenges/:regNo', (req, res) => {
      try {
          const { regNo } = req.params;
          const row = qdb.prepare('SELECT * FROM completedChallenges WHERE candID = ?').all(regNo);
          res.json({ row });
      } catch (err) {
          console.error('Error retrieving completed challenges:', err);
          res.status(500).json({ error: 'Error retrieving completed challenges' });
      }
  });

  serVer.post('/api/storeCompChallenges', (req, res) => {
      try {
          const { candID, challengeID, completionDate } = req.body;
          const stmt = qdb.prepare('INSERT INTO completedChallenges (candID, challengeID, completionDate) VALUES (?, ?, ?)');
          stmt.run(candID, challengeID, completionDate);
          res.json({ message: 'Challenges stored successfully' });
      } catch (err) {
          console.error('Error inserting data:', err.message);
          res.status(500).json({ error: 'Error storing challenges' });
      }
  });

  serVer.get('/api/subjects', (req, res) => {
      try {
          const results = qdb.prepare('SELECT * FROM subjects').all();
          res.json(results);
      } catch (err) {
          console.error('Error retrieving subjects:', err);
          res.status(500).json({ error: 'Internal server error' });
      }
  });

  serVer.get('/api/quizequestions/:subjectId', (req, res) => {
      try {
          const { subjectId } = req.params;
          const subjectIdArray = subjectId.split(',');
          const placeholders = subjectIdArray.map(() => '?').join(',');
          const query = `SELECT * FROM question WHERE subjID IN (${placeholders})`;
          const stmt = qdb.prepare(query);
          const results = stmt.all(...subjectIdArray);
          res.json(results);
      } catch (err) {
          console.error('Error retrieving quiz questions:', err);
          res.status(500).json({ error: 'Internal server error' });
      }
  });




/////////////////////////////////////newwwww///////////////



// Create activation tables when server starts

// ==================== SYSTEM ACTIVATION ENDPOINTS ====================

function normalizeSystemId(systemId) {
    if (!systemId) {
        throw new Error('System ID is required');
    }
    
    // Remove ALL whitespace, dashes, and convert to uppercase
    const normalized = systemId
        .toString()
        .trim()
        .replace(/[\s\-]/g, '')  // Remove spaces and dashes
        .toUpperCase();
    
    console.log('🔄 Normalized System ID:');
    console.log('  Input:  ', JSON.stringify(systemId));
    console.log('  Output: ', JSON.stringify(normalized));
    console.log('  Length: ', normalized.length);
    
    if (normalized.length === 0) {
        throw new Error('System ID cannot be empty');
    }
    
    return normalized;
}

function generateActivationKey(systemId) {
    // ALWAYS normalize first
    const normalized = normalizeSystemId(systemId);
    
    // Create deterministic hash
    const inputString = normalized + ACTIVATION_SECRET;
    
    const hash = crypto
        .createHash('sha256')
        .update(inputString)
        .digest('hex')
        .substring(0, 16)
        .toUpperCase();
    
    // Format as XXXX-XXXX-XXXX-XXXX
    const formattedKey = hash.match(/.{1,4}/g).join('-');
    
    console.log('🔑 Generated Key:', formattedKey, 'for', normalized.substring(0, 20) + '...');
    
    return formattedKey;
}

function verifyActivationKey(systemId, activationKey) {
    try {
        // Normalize both inputs
        const normalizedSystemId = normalizeSystemId(systemId);
        const normalizedKey = activationKey
            .toString()
            .trim()
            .replace(/[\s\-]/g, '')
            .toUpperCase();
        
        // Generate expected key
        const expectedKey = generateActivationKey(normalizedSystemId).replace(/-/g, '');
        
        const isValid = expectedKey === normalizedKey;
        
        console.log('🔍 Verification:');
        console.log('  System ID:', normalizedSystemId.substring(0, 20) + '...');
        console.log('  Expected: ', expectedKey);
        console.log('  Received: ', normalizedKey);
        console.log('  Valid:    ', isValid ? '✅' : '❌');
        
        return isValid;
    } catch (error) {
        console.error('❌ Verification error:', error.message);
        return false;
    }
}

// ==================== USER ACTIVATION ENDPOINT ====================
serVer.get('/api/check-activation-status/:systemId', (req, res) => {
    try {
        const { systemId } = req.params;
        
        // Normalize the system ID
        const normalizedSystemId = normalizeSystemId(decodeURIComponent(systemId));
        
        console.log('Checking activation for:', normalizedSystemId);
        
        const activation = actdb.prepare(
            'SELECT * FROM user_activations WHERE systemId = ?'
        ).get(normalizedSystemId);
        
        if (activation) {
            res.json({
                isActivated: true,
                activationKey: activation.activationKey,
                activatedAt: activation.activatedAt,
                status: activation.status
            });
        } else {
            res.json({
                isActivated: false,
                activationKey: null,
                activatedAt: null,
                status: 'inactive'
            });
        }
    } catch (error) {
        console.error('Error checking activation status:', error);
        res.status(500).json({
            isActivated: false,
            error: 'Failed to check activation status'
        });
    }
});
// Admin - Generate Key
serVer.post('/api/admin/generate-activation-key', (req, res) => {
    try {
        const { systemId, adminPassword } = req.body;
        
        if (adminPassword !== ADMIN_PASSWORD) {
            return res.json({
                success: false,
                message: 'Invalid admin password'
            });
        }
        
        if (!systemId) {
            return res.json({
                success: false,
                message: 'System ID is required'
            });
        }

        // Normalize FIRST
        const normalizedSystemId = normalizeSystemId(systemId);
        
        // Check if key already exists for THIS normalized ID
        const existing = actdb.prepare(
            'SELECT * FROM admin_activations WHERE systemId = ?'
        ).get(normalizedSystemId);
        
        if (existing) {
            console.log('✅ Returning existing key for:', normalizedSystemId.substring(0, 20) + '...');
            return res.json({
                success: true,
                activationKey: existing.activationKey,
                message: 'Key already exists for this system',
                generatedAt: existing.generatedAt,
                isExisting: true
            });
        }
        
        // Generate NEW key
        const activationKey = generateActivationKey(normalizedSystemId);
        const generatedAt = new Date().toISOString();
        
        // Store with normalized system ID
        actdb.prepare(
            'INSERT INTO admin_activations (systemId, activationKey, generatedAt, status) VALUES (?, ?, ?, ?)'
        ).run(normalizedSystemId, activationKey, generatedAt, 'pending');
        
        console.log('✅ Generated NEW key for:', normalizedSystemId.substring(0, 20) + '...');
        
        res.json({
            success: true,
            systemId: normalizedSystemId,
            activationKey: activationKey,
            generatedAt: generatedAt,
            isExisting: false
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate activation key'
        });
    }
});

// User - Activate System
serVer.post('/api/activate-system', (req, res) => {
    try {
        const { systemId, activationKey } = req.body;
        
        if (!systemId || !activationKey) {
            return res.json({
                success: false,
                message: 'System ID and Activation Key are required'
            });
        }

        // Normalize FIRST
        const normalizedSystemId = normalizeSystemId(systemId);
        
        // Verify the key using normalized ID
        if (!verifyActivationKey(normalizedSystemId, activationKey)) {
            console.log('❌ Invalid activation key');
            return res.json({
                success: false,
                message: 'Invalid activation key. Please verify and try again.'
            });
        }
        
        // Check if already activated (use normalized ID)
        const existingActivation = actdb.prepare(
            'SELECT * FROM user_activations WHERE systemId = ?'
        ).get(normalizedSystemId);
        
        if (existingActivation) {
            console.log('✅ System already activated');
            return res.json({
                success: true,
                message: 'System is already activated',
                activatedAt: existingActivation.activatedAt
            });
        }
        
        // Activate with normalized ID
        const activatedAt = new Date().toISOString();
        const normalizedKey = activationKey.trim().replace(/[\s\-]/g, '').toUpperCase();
        
        actdb.prepare(
            'INSERT INTO user_activations (systemId, activationKey, activatedAt, status) VALUES (?, ?, ?, ?)'
        ).run(normalizedSystemId, normalizedKey, activatedAt, 'active');
        
        console.log('✅ System activated successfully');
        
        res.json({
            success: true,
            message: 'System activated successfully!',
            activatedAt: activatedAt
        });
        
    } catch (error) {
        console.error('❌ Activation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to activate system'
        });
    }
});

// 5. Get all activations list (Admin)

// 6. Delete/Revoke activation (Admin)
serVer.delete('/api/admin/revoke-activation/:systemId', (req, res) => {
    try {
        const { systemId } = req.params;
        const { adminPassword } = req.body;
        
        if (adminPassword !== ADMIN_PASSWORD) {
            return res.json({
                success: false,
                message: 'Invalid admin password'
            });
        }
        
        // Delete from user_activations (this is the important one)
        const deletedUser = actdb.prepare('DELETE FROM user_activations WHERE systemId = ?')
            .run(systemId);
        
        // Optionally keep admin record but mark as revoked
        actdb.prepare('UPDATE admin_activations SET status = ? WHERE systemId = ?')
            .run('revoked', systemId);
        
        console.log('✅ Activation revoked for:', systemId);
        
        res.json({
            success: true,
            message: 'Activation revoked successfully',
            affectedRows: deletedUser.changes
        });
        
    } catch (error) {
        console.error('Error revoking activation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to revoke activation'
        });
    }
});

serVer.get('/api/system-id', (req, res) => {
    try {
        const machineId = machineIdSync();
        const formattedId = `HW-${machineId.toUpperCase()}`;
        
        // Normalize the system ID before sending
        const normalizedId = normalizeSystemId(formattedId);
        
        console.log('System ID requested:', normalizedId);
        
        res.json({ 
            systemId: normalizedId,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('Error getting system ID:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve system ID',
            systemId: null
        });
    }
});
serVer.get('/api/admin/activations-list', (req, res) => {
    try {
        // Get all systems from admin_activations
        const adminActivations = actdb.prepare(
            'SELECT * FROM admin_activations ORDER BY generatedAt DESC'
        ).all();
        
        // Get all activated systems from user_activations
        const userActivations = actdb.prepare(
            'SELECT * FROM user_activations ORDER BY activatedAt DESC'
        ).all();
        
        // Combine data with normalized comparison
        const activations = adminActivations.map(admin => {
            // Normalize both system IDs before comparing
            const normalizedAdminId = normalizeSystemId(admin.systemId);
            
            const user = userActivations.find(u => {
                try {
                    const normalizedUserId = normalizeSystemId(u.systemId);
                    return normalizedUserId === normalizedAdminId;
                } catch {
                    return false;
                }
            });
            
            return {
                systemId: normalizedAdminId, // Return normalized ID
                activationKey: admin.activationKey,
                generatedAt: admin.generatedAt,
                status: user ? 'active' : 'pending',
                activatedAt: user ? user.activatedAt : null
            };
        });
        
        res.json({
            success: true,
            activations: activations
        });
        
    } catch (error) {
        console.error('Error fetching activations list:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activations'
        });
    }
});
// Test consistency
serVer.post('/api/test-key-consistency', (req, res) => {
    const { systemId } = req.body;
    
    try {
        // Generate key 10 times with slight variations in input
        const tests = [
            systemId,                                    // Original
            systemId.toLowerCase(),                      // Lowercase
            systemId.toUpperCase(),                      // Uppercase
            '  ' + systemId + '  ',                     // Extra spaces
            systemId.replace(/-/g, ''),                 // No dashes
            systemId + '\n',                            // Trailing newline
        ];
        
        const keys = tests.map(test => ({
            input: JSON.stringify(test),
            key: generateActivationKey(test)
        }));
        
        const allSame = keys.every(k => k.key === keys[0].key);
        
        res.json({
            allKeysIdentical: allSame,
            tests: keys,
            result: allSame ? '✅ PASS' : '❌ FAIL'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});






//////////////////////////////////////end ofnew///////////////////////





  // Catch-all route for React Router - MUST BE LAST
  serVer.get('*', (req, res) => {
      const indexPath = path.join(buildPath, 'index.html');
      if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
      } else {
          res.status(404).send('Application not found');
      }
  });

  server = serVer.listen(port, '127.0.0.1', (err) => {
      if (err) {
          console.error('❌ Failed to start server:', err);
          dialog.showErrorBox('Server Error', `Failed to start server: ${err.message}`);
          app.quit();
          return;
      }

      console.log('\n' + '='.repeat(60));
      console.log(`✅ Express server running on http://127.0.0.1:${port}`);
      console.log('='.repeat(60) + '\n');
      
      createWindow();
      
      setTimeout(() => {
        if (mainWindow) {
          mainWindow.loadURL(`http://127.0.0.1:${port}`);
          console.log('✅ Window loaded\n');
        }
      }, 1000);
  });

  server.on('error', (err) => {
      console.error('❌ Server error:', err);
      dialog.showErrorBox('Server Error', `Server error: ${err.message}`);
      app.quit();
  });

  app.on('before-quit', () => {
      console.log('\nShutting down...');
      try {
          if (server) {
              server.close();
              console.log('✅ Server closed');
          }
          if (db) {
              db.close();
              console.log('✅ Candidates DB closed');
          }
          if (qdb) {
              qdb.close();
              console.log('✅ Questions DB closed');
          }
          console.log('✅ Cleanup completed\n');
      } catch (err) {
          console.error('Error during cleanup:', err);
      }
  });
}

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});