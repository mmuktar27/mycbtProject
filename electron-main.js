const { app, BrowserWindow } = require('electron');
const express = require('express');
const path = require('path');

const serVer = express();

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    autoHideMenuBar: true,
    useContentSize: true,
    resizable: false,
  });

  // Load the ReactJS app
  mainWindow.loadURL('http://localhost:8088/');
  mainWindow.focus();

  // Open the DevTools if needed
  // mainWindow.webContents.openDevTools()
}

// Create window when Electron is ready
app.on('ready', () => {
  // Start Express server
  const Database = require('better-sqlite3'); // Changed from sqlite3
  const bodyParser = require('body-parser');
  const cors = require('cors');
  const serVer = express();
  
  serVer.use(express.json({ limit: '50mb' }));
  const port = process.env.PORT || 8088;

  // Serve static files from the React app
  serVer.use(express.static(path.join(__dirname, './build')));

  // Increase the payload limit for URL-encoded data
  serVer.use(express.urlencoded({ limit: '50mb', extended: true }));
  // Use bodyParser middleware to parse JSON requests
  serVer.use(bodyParser.json());
  // Enable CORS for all routes
  serVer.use(cors());

  // Connect to SQLite databases (better-sqlite3 is synchronous)
  const db = new Database('./candidates.db');
  console.log('Connected to the candidate SQLite database.');

  // Create candidates table (synchronous)
  db.exec(`CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candregno TEXT,
      fullname TEXT,
      img TEXT,
      subj1 TEXT,
      subj2 TEXT,
      subj3 TEXT
  )`);
  console.log('Candidates table created or already exists.');

  // Questions database
  const qdb = new Database('./questions.db');
  console.log('Connected to the questions SQLite database.');

  // Define API endpoints

  // Get all candidates
  serVer.get('/api/candidates', (req, res) => {
      try {
          const rows = db.prepare('SELECT * FROM candidates').all();
          res.json(rows);
      } catch (err) {
          console.error('Error getting candidates:', err.message);
          res.status(500).json({ error: 'Internal server error' });
      }
  });

  // Add a new candidate
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

  // Check if candidate exists
  const checkCandidateInDB = (regNo) => {
      try {
          const row = db.prepare('SELECT * FROM candidates WHERE candregno = ?').get(regNo);
          return !!row;
      } catch (err) {
          throw err;
      }
  };

  // Route to handle checking if candidate exists
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

  // Get candidate information
  serVer.get('/api/get-candidate/:regNo', (req, res) => {
      try {
          const regNo = req.params.regNo;
          const row = db.prepare('SELECT * FROM candidates WHERE candregno = ?').get(regNo);
          res.json(row);
      } catch (err) {
          console.error('Error getting questions:', err.message);
          res.status(500).json({ error: 'Internal server error' });
      }
  });

  // Get exam questions
  serVer.get('/api/exam-question', (req, res) => {
      try {
          const rows = qdb.prepare('SELECT * FROM question WHERE subjID in ("ENG","BIO","CHEM","PHY")').all();
          res.json(rows);
      } catch (err) {
          console.error('Error getting questions:', err.message);
          res.status(500).json({ error: 'Internal server error' });
      }
  });

  // Get exam questions by registration number
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

  // Save answer
  serVer.post('/api/saveAnswer', (req, res) => {
      try {
          const { qid, canid, subjid, examID, selectedOption } = req.body;
          const stmt = qdb.prepare('INSERT INTO answered (qid, canid, subjid, examID, selectedOption) VALUES (?, ?, ?, ?, ?)');
          stmt.run(qid, canid, subjid, examID, selectedOption);
          console.log('Selected option saved successfully');
          res.send('Selected option saved successfully');
      } catch (err) {
          console.error('Error saving selected option:', err.message);
          res.status(500).send('Error saving selected option');
      }
  });

  // Update answer (Note: You had duplicate POST /api/saveAnswer - keeping both as separate endpoints)
  serVer.put('/api/updateAnswer', (req, res) => {
      try {
          const { qid, canid, subjid, examID, selectedOption } = req.body;
          const stmt = qdb.prepare('UPDATE answered SET selectedOption = ? WHERE qid = ? AND canid = ? AND subjid = ? AND examID = ?');
          stmt.run(selectedOption, qid, canid, subjid, examID);
          console.log('Selected option updated successfully');
          res.send('Selected option updated successfully');
      } catch (err) {
          console.error('Error updating selected option:', err.message);
          res.status(500).send('Error updating selected option');
      }
  });

  // Check answer
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

  // Update answer by ID
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

  // Get answers
  serVer.get('/api/getAnswer/:examID/:regNo', (req, res) => {
      try {
          const { examID, regNo } = req.params;
          const rows = qdb.prepare('SELECT selectedOption, subjid, qid FROM answered WHERE examID = ? AND canid = ?').all(examID, regNo);
          console.log('Retrieved selected options:', rows);
          res.json(rows);
      } catch (err) {
          console.error('Error retrieving selected options:', err.message);
          res.status(500).send('Error retrieving selected options');
      }
  });

  // Get timer state
  serVer.get('/api/getTimerState', (req, res) => {
      try {
          const { examID, regNo } = req.query;
          const row = qdb.prepare('SELECT timeElapse FROM exams WHERE examID = ? AND candID = ?').get(examID, regNo);
          const timeElapsed = row ? row.timeElapse : null;
          console.log('Retrieved timer state:', timeElapsed);
          res.json({ timeElapsed });
      } catch (err) {
          console.error('Error retrieving timer state:', err.message);
          res.status(500).send('Error retrieving timer state');
      }
  });

  // Get time count
  serVer.get('/api/gettimeCount/:examID/:regNo', (req, res) => {
      try {
          const { examID, regNo } = req.params;
          const row = qdb.prepare('SELECT timeElapse FROM exams WHERE examID = ? AND candID = ?').get(examID, regNo);
          const timeElapsed = row ? row.timeElapse : null;
          console.log('Retrieved timer state:', timeElapsed);
          res.json({ timeElapsed });
      } catch (err) {
          console.error('Error retrieving timer state:', err.message);
          res.status(500).send('Error retrieving timer state');
      }
  });

  // Update timer state
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
          
          console.log('Timer state updated successfully');
          res.sendStatus(200);
      } catch (err) {
          console.error('Error updating timer state:', err.message);
          res.status(500).send('Error updating timer state');
      }
  });

  // Submit registration form
  serVer.post('/api/submitRegFormData', (req, res) => {
      try {
          const formData = req.body;
          const stmt = db.prepare('INSERT INTO candidates (candregno, fullname, img, subj1, subj2, subj3) VALUES (?, ?, ?, ?, ?, ?)');
          stmt.run(formData.candregno, formData.fullname, formData.img, formData.subj1, formData.subj2, formData.subj3);
          console.log('Form data submitted successfully');
          res.status(200).json({ message: 'Form data submitted successfully', formData });
      } catch (err) {
          console.error('Error inserting form data into database:', err.message);
          res.status(500).json({ message: 'Error submitting form data' });
      }
  });

  // Create exams
  serVer.post('/api/createexams', (req, res) => {
      try {
          const { examID, candID, status, timeElapse } = req.body;
          const stmt = qdb.prepare('INSERT INTO exams (examID, timeElapse, candID, status) VALUES (?, ?, ?, ?)');
          stmt.run(examID, timeElapse, candID, status);
          console.log('Form data submitted successfully');
          res.status(200).json({ message: 'Form data submitted successfully' });
      } catch (err) {
          console.error('Error inserting form data into database:', err.message);
          res.status(500).json({ message: 'Error submitting form data' });
      }
  });

  // Check exams
  serVer.get('/api/checkexams/:regNo', (req, res) => {
      try {
          const { regNo } = req.params;
          const row = qdb.prepare('SELECT examID FROM exams WHERE status = ? AND candID = ?').get('Ongoing', regNo);
          const examID = row ? row.examID : null;
          res.json({ examID });
          console.log('Exam ID:', examID);
      } catch (err) {
          console.error('Error retrieving exam:', err);
          res.status(500).json({ error: 'Error retrieving exam' });
      }
  });

  // Check candidate
  serVer.get('/api/checkcandidate/:regNo', (req, res) => {
      try {
          const { regNo } = req.params;
          const row = db.prepare('SELECT * FROM candidates WHERE candregno = ?').get(regNo);
          const candid = row ? row.candregno : null;
          res.json({ candid });
          console.log('Cand ID:', candid);
      } catch (err) {
          console.error('Error retrieving cand:', err);
          res.status(500).json({ error: 'Error retrieving cand' });
      }
  });

  // Get exams
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

  // Get challenges
  serVer.get('/api/challenges', (req, res) => {
      try {
          const row = qdb.prepare('SELECT * FROM challenges').all();
          res.json({ row });
      } catch (err) {
          console.error('Error retrieving cand:', err);
          res.status(500).json({ error: 'Error retrieving cand' });
      }
  });

  // Get completed challenges
  serVer.get('/api/completedchallenges/:regNo', (req, res) => {
      try {
          const { regNo } = req.params;
          const row = qdb.prepare('SELECT * FROM completedChallenges WHERE candID = ?').all(regNo);
          res.json({ row });
      } catch (err) {
          console.error('Error retrieving cand:', err);
          res.status(500).json({ error: 'Error retrieving cand' });
      }
  });

  // Store completed challenges
  serVer.post('/api/storeCompChallenges', (req, res) => {
      try {
          const { candID, challengeID, completionDate } = req.body;
          const stmt = qdb.prepare('INSERT INTO completedChallenges (candID, challengeID, completionDate) VALUES (?, ?, ?)');
          stmt.run(candID, challengeID, completionDate);
          console.log('Data inserted successfully');
          res.json({ message: 'Challenges stored successfully' });
      } catch (err) {
          console.error('Error inserting data:', err.message);
          res.status(500).json({ error: 'Error storing challenges' });
      }
  });

  // Get subjects
  serVer.get('/api/subjects', (req, res) => {
      try {
          const results = qdb.prepare('SELECT * FROM subjects').all();
          res.json(results);
      } catch (err) {
          console.error('Error retrieving subjects:', err);
          res.status(500).json({ error: 'Internal server error' });
      }
  });

  // Get quiz questions
  serVer.get('/api/quizequestions/:subjectId', (req, res) => {
      try {
          const { subjectId } = req.params;
          const subjectIdArray = subjectId.split(',');
          
          // Create placeholders for prepared statement
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

  // Graceful shutdown for databases when app closes
  app.on('before-quit', () => {
      db.close();
      qdb.close();
      console.log('Databases closed');
  });

  // Define your Express routes here

  // Start the Express server
  serVer.listen(port, () => {
      console.log(`Express server is running on port ${port}`);
  });

  // Create the Electron window
  createWindow();
});

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
