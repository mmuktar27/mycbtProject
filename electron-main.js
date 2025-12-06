const { app, BrowserWindow } = require('electron');
const express = require('express');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    autoHideMenuBar: true,
    useContentSize: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Don't load URL immediately - wait for server to start
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance lock
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
    startServer();
  });
}

function startServer() {
  const Database = require('better-sqlite3');
  const bodyParser = require('body-parser');
  const cors = require('cors');
  const serVer = express();
  
  const port = 8088;
  const isDev = !app.isPackaged;
  
  console.log('Environment:', isDev ? 'Development' : 'Production');
  console.log('App path:', app.getAppPath());
  console.log('User data path:', app.getPath('userData'));

  // Configure paths based on environment
  let buildPath, dbPath, qdbPath;
  
  if (isDev) {
    // Development paths
    buildPath = path.join(__dirname, 'build');
    dbPath = path.join(__dirname, 'candidates.db');
    qdbPath = path.join(__dirname, 'questions.db');
  } else {
    // Production paths
    buildPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'build');
    
    // Check if build exists in unpacked location
    if (!require('fs').existsSync(buildPath)) {
      buildPath = path.join(app.getAppPath(), 'build');
    }
    
    // Database in user data directory for write access
    const userDataPath = app.getPath('userData');
    dbPath = path.join(userDataPath, 'candidates.db');
    qdbPath = path.join(userDataPath, 'questions.db');
    
    // Copy database files if they don't exist
    const fs = require('fs');
    const sourceCandidatesDb = path.join(app.getAppPath(), 'candidates.db');
    const sourceQuestionsDb = path.join(app.getAppPath(), 'questions.db');
    
    if (!fs.existsSync(dbPath) && fs.existsSync(sourceCandidatesDb)) {
      fs.copyFileSync(sourceCandidatesDb, dbPath);
      console.log('Copied candidates.db to user data');
    }
    
    if (!fs.existsSync(qdbPath) && fs.existsSync(sourceQuestionsDb)) {
      fs.copyFileSync(qdbPath, qdbPath);
      console.log('Copied questions.db to user data');
    }
  }

  console.log('Build path:', buildPath);
  console.log('Candidates DB path:', dbPath);
  console.log('Questions DB path:', qdbPath);

  // Express middleware
  serVer.use(express.json({ limit: '50mb' }));
  serVer.use(express.urlencoded({ limit: '50mb', extended: true }));
  serVer.use(bodyParser.json());
  serVer.use(cors());

  // Serve static files
  serVer.use(express.static(buildPath));

  // Connect to databases
  let db, qdb;
  
  try {
    db = new Database(dbPath);
    console.log('✅ Connected to candidates database');
    db.pragma('journal_mode = WAL');
    
    // Create tables
    db.exec(`CREATE TABLE IF NOT EXISTS candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        candregno TEXT,
        fullname TEXT,
        img TEXT,
        subj1 TEXT,
        subj2 TEXT,
        subj3 TEXT
    )`);
    
    qdb = new Database(qdbPath);
    console.log('✅ Connected to questions database');
    qdb.pragma('journal_mode = WAL');
  } catch (err) {
    console.error('❌ Database connection error:', err);
    app.quit();
    return;
  }

  // API Routes (keep all your existing routes)
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

  const checkCandidateInDB = (regNo) => {
      try {
          const row = db.prepare('SELECT * FROM candidates WHERE candregno = ?').get(regNo);
          return !!row;
      } catch (err) {
          throw err;
      }
  };

  serVer.post('/api/check-candidate', async (req, res) => {
      const { regNo } = req.body;
      try {
          const isCandidateExists = checkCandidateInDB(regNo);
          res.json({ exists: isCandidateExists });
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
          const stmt = db.prepare('INSERT INTO candidates (candregno, fullname, img, subj1, subj2, subj3) VALUES (?, ?, ?, ?, ?, ?)');
          stmt.run(formData.candregno, formData.fullname, formData.img, formData.subj1, formData.subj2, formData.subj3);
          res.status(200).json({ message: 'Form data submitted successfully', formData });
      } catch (err) {
          console.error('Error inserting form data into database:', err.message);
          res.status(500).json({ message: 'Error submitting form data' });
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
          console.error('Error retrieving cand:', err);
          res.status(500).json({ error: 'Error retrieving cand' });
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

  // Catch-all route - MUST be last
  serVer.get('*', (req, res) => {
      res.sendFile(path.join(buildPath, 'index.html'));
  });

  // Start server
  const server = serVer.listen(port, '127.0.0.1', () => {
      console.log(`✅ Express server running on http://127.0.0.1:${port}`);
      
      // Now load the window
      createWindow();
      
      // Wait a bit for server to be ready, then load URL
      setTimeout(() => {
        if (mainWindow) {
          mainWindow.loadURL(`http://127.0.0.1:${port}`);
          console.log('✅ Window loaded');
        }
      }, 500);
  });

  server.on('error', (err) => {
      console.error('❌ Server error:', err);
      app.quit();
  });

  // Cleanup
  app.on('before-quit', () => {
      try {
          server.close();
          db.close();
          qdb.close();
          console.log('✅ Cleanup completed');
      } catch (err) {
          console.error('Error during cleanup:', err);
      }
  });
}

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});