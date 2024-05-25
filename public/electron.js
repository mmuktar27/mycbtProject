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
  const sqlite3 = require('sqlite3').verbose(); // Import SQLite3 module
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



const db = new sqlite3.Database('./candidates.db', sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Error connecting to candidate database:', err.message);
    } else {
        console.log('Connected to the candidate SQLite database.');

        // Check if the 'candidates' table exists and create it if it doesn't
        db.run(`CREATE TABLE IF NOT EXISTS candidates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            candregno TEXT,
            fullname TEXT,
            img TEXT
            sub1 TEXT,
            sub2 TEXT,
            sub3 TEXT
        )`, (createErr) => {
            if (createErr) {
                console.error('Error creating table:', createErr.message);
            } else {
                console.log('Candidates table created or already exists.');
            }
        });
    }
});

// "candregno" "fullname", "img", "sub1" , "subj2", "subj3"

//CREATE TABLE "question" ( "id","subjID","question", "optA","optB","optC","optD","answer"

//CREATE TABLE "subjects" ( "id" INTEGER NOT NULL, "subj", "subjID","desc"

const qdb = new sqlite3.Database('./questions.db', sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
      console.error('Error connecting to questions database:', err.message);
  } else {
      console.log('Connected to the questions SQLite database.');

  }
});

// Define API endpoints

// Get all candidates
serVer.get('/api/candidates', (req, res) => {
    db.all('SELECT * FROM candidates', (err, rows) => {
        if (err) {
            console.error('Error getting candidates:', err.message);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.json(rows);
        }
    });
});

// Add a new candidate
serVer.post('/api/candidates', (req, res) => {
    const { candregno, fullname, img } = req.body;
    db.run('INSERT INTO candidates (candregno, fullname, img) VALUES (?, ?, ?)', [candregno, fullname, img], function(err) {
        if (err) {
            console.error('Error adding candidate:', err.message);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.json({ id: this.lastID });
        }
    });
});




const checkCandidateInDB = (regNo) => {
    return new Promise((resolve, reject) => {
  
  
      // Query the database to check if the candidate exists
      db.get('SELECT * FROM candidates WHERE candregno = ?', [regNo], (err, row) => {
        if (err) {
          reject(err);
        } else {
          // If row is not null, candidate exists; otherwise, candidate doesn't exist
          resolve(!!row);
        }
      });
  
      // Close the database connection
    
    });
  };
  
  // Route to handle checking if candidate exists
  serVer.post('/api/check-candidate', async (req, res) => {
    const { regNo } = req.body;
  
    // Check if the candidate exists in the database
    try {
      const isCandidateExists = await checkCandidateInDB(regNo);
      res.json({ exists: isCandidateExists });
    } catch (error) {
      console.error('Error checking candidate in DB:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


//get candidate information

  serVer.get('/api/get-candidate/:regNo', (req, res) => {
    const regNo = req.params.regNo;
    db.get('SELECT * FROM candidates WHERE candregno = ?', [regNo], (err, rows) => {
        if (err) {
            console.error('Error getting questions:', err.message);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.json(rows);
        }
    });
  });

//CREATE TABLE "question" ( "id","subjID","question", "optA","optB","optC","optD","answer"

//CREATE TABLE "subjects" ( "id" INTEGER NOT NULL, "subj", "subjID","desc"
/// fetching exams questions based on users profile
// Get all candidates
serVer.get('/api/exam-question', (req, res) => {
  qdb.all('SELECT * FROM question WHERE subjID in ("ENG","BIO","CHEM","PHY") ', (err, rows) => {
      if (err) {
          console.error('Error getting questions:', err.message);
          res.status(500).json({ error: 'Internal server error' });
      } else {
          res.json(rows);
      }
  });
});



serVer.get('/api/exam-questions/:regNo', (req, res) => {
  const regNo = req.params.regNo;

  // Query the candidate table to fetch the subjects associated with the candidate's registration number
  const candidateQuery = 'SELECT subj1, subj2, subj3 FROM candidates WHERE candregno= ?';
  db.get(candidateQuery, [regNo], (err, candidateData) => {
    if (err) {
      console.error('Error getting candidate data:', err.message);
      res.status(500).json({ error: 'Internal server error fetching Candidate' });
    } else {
      // Extract subjects from candidateData
      const candidateSubjects = [candidateData.subj1, candidateData.subj2, candidateData.subj3].filter(Boolean);

      // Use candidateSubjects to fetch subject details from the subjects table
      const subjectDetailsQuery = 'SELECT subj,subjID FROM subjects WHERE subjID IN (?,?,?,?)';
      qdb.all(subjectDetailsQuery, ["ENG",candidateData.subj1, candidateData.subj2, candidateData.subj3], (err, subjectRows) => {
        if (err) {
          console.error('Error getting subject data:', err.message);
          res.status(500).json({ error: 'Internal server error fetching subject' });
        } else {
          // Use candidateSubjects to filter questions from the questions table
          const questionQuery = 'SELECT * FROM question WHERE subjID IN (?,?,?,?)';
          qdb.all(questionQuery, ["ENG",candidateData.subj1, candidateData.subj2, candidateData.subj3], (err, questionRows) => {
            if (err) {
              console.error('Error getting questions:', err.message);
              res.status(500).json({ error: 'Internal server error fetching questions' });
            } else {
              const responseData = {
                candidateSubjects: subjectRows,
                questions: questionRows
              };
              // Send the response containing both candidateSubjects and questions
              res.json(responseData);
            }
          });
        }
      });
    }
  });
});



//handling saving of users selected options

// Endpoint to save the user's selected option
serVer.post('/api/saveAnswer', (req, res) => {
  const { qid,canid,subjid,examID,selectedOption } = req.body;
  // Insert the selected option into the 'answered' table
  qdb.run(`INSERT INTO answered ( qid,canid,subjid,examID,selectedOption) VALUES (?, ?, ?,?,?)`,
    [qid,canid,subjid,examID,selectedOption], (err) => {
      if (err) {
        console.error('Error saving selected option:', err.message);
        res.status(500).send('Error saving selected option');
      } else {
        console.log('Selected option saved successfully');
        res.send('Selected option saved successfully');
      }
    });
});
//updating answer
serVer.post('/api/saveAnswer', (req, res) => {
  const { qid, canid, subjid, examID, selectedOption } = req.body;
  // Update the selected option in the 'answered' table
  qdb.run(`UPDATE answered SET selectedOption = ? WHERE qid = ? AND canid = ? AND subjid = ? AND examID = ?`,
    [selectedOption, qid, canid, subjid, examID], (err) => {
      if (err) {
        console.error('Error updating selected option:', err.message);
        res.status(500).send('Error updating selected option');
      } else {
        console.log('Selected option updated successfully');
        res.send('Selected option updated successfully');
      }
    });
});

// Endpoint to check if the user has already answered the question
serVer.get('/api/checkAnswer/:questionId/:candid/:subjId/:examID', (req, res) => {
  const { questionId, candid, subjId,examID } = req.params;
 

  // Query the database to check if the user has already answered the question
  qdb.get(`SELECT * FROM answered WHERE qid = ? AND canid = ? AND subjid = ? AND examID = ?`, [questionId, candid, subjId, examID], (err, row) => {
    if (err) {
      console.error('Error checking existing answer:', err.message);
      res.status(500).send('Error checking existing answer');
      return;
    }

    // Send the existing answer data (if found) or null otherwise
    res.json(row || null);
  });
});

// Define the route handler for updating the selected option
serVer.put('/api/saveAnswer/:id', (req, res) => {
  const { id } = req.params;
  const { selectedOption } = req.body;

  // Update the selected option in the database
  qdb.run(`UPDATE answered SET selectedOption = ? WHERE id = ?`, [selectedOption, id], (err) => {
    if (err) {
      console.error('Error updating selected option:', err.message);
      res.status(500).send('Error updating selected option');
      return;
    }

    // Send a success response
    res.send('Selected option updated successfully');
  });
});


// Endpoint to retrieve the user's selected option
serVer.get('/api/getAnswer/:examID/:regNo', (req, res) => {
  const { examID, regNo } = req.params; // Retrieve examID and regNo from URL parameters

  // Query the 'answered' table to retrieve the selected option
  qdb.all(`SELECT selectedOption, subjid, qid FROM answered WHERE examID = ? AND canid = ?`,
    [examID, regNo], (err, rows) => { // Changed 'row' to 'rows' to represent multiple rows
      if (err) {
        console.error('Error retrieving selected options:', err.message);
        res.status(500).send('Error retrieving selected options');
      } else {
        console.log('Retrieved selected options:', rows);
        res.json(rows); // Send all fields for each selected option
      }
    });
});


//handling of exam timer

// API endpoint to get timer state from the database
serVer.get('/api/getTimerState', (req, res) => {
  const { examID, regNo } = req.query;

  // Query the database to retrieve the timer state
  qdb.get('SELECT timeElapse FROM exams WHERE examID = ? AND candID = ?', [examID, regNo], (err, row) => {
    if (err) {
      console.error('Error retrieving timer state:', err.message);
      res.status(500).send('Error retrieving timer state');
    } else {
      const timeElapsed = row ? row.timeElapse : null;
      console.log('Retrieved timer state:', timeElapsed);
      res.json({ timeElapsed });
    }
  });
});


serVer.get('/api/gettimeCount/:examID/:regNo', (req, res) => {
  const { examID, regNo } = req.params; // Retrieve examID and regNo from URL parameters

  qdb.get('SELECT timeElapse FROM exams WHERE examID = ? AND candID = ?', [examID, regNo], (err, row) => {
    if (err) {
      console.error('Error retrieving timer state:', err.message);
      res.status(500).send('Error retrieving timer state');
    } else {
      const timeElapsed = row ? row.timeElapse : null;
      console.log('Retrieved timer state:', timeElapsed);
      res.json({ timeElapsed });
    }
  });
//console.log(examID)

});



// API endpoint to update timer state in the database
serVer.put('/api/updateTimerState', (req, res) => {
  const { newTimeElapsed, status,examID, regNo } = req.body;

  let sqlStatement = ""; // Initialize the SQL statement variable
  let params = []; // Initialize the parameters for the SQL statement

  if (status === "Elapsed" || status === "Submitted") {
    // If the status is 'elapsed' or 'submitted', update both timeElapsed and status
    sqlStatement = "UPDATE exams SET timeElapse = ?, status = ? WHERE examID = ? AND candID = ?";
    params = [newTimeElapsed, status, examID, regNo];
  } else {
    // If the status is neither 'elapsed' nor 'submitted', update only timeElapsed
    sqlStatement = "UPDATE exams SET timeElapse = ? WHERE examID = ? AND candID = ?";
    params = [newTimeElapsed, examID, regNo];
  }

  qdb.run(sqlStatement, params, function(err) {
    if (err) {
      console.error('Error updating timer state:', err.message);
      res.status(500).send('Error updating timer state');
    } else {
      console.log('Timer state updated successfully');
      res.sendStatus(200);
    }
  });


});


serVer.post('/api/submitRegFormData', (req, res) => {
  const formData = req.body;

  // Insert the form data into the database
  db.run(`INSERT INTO candidates (candregno, fullname, img, subj1, subj2, subj3) VALUES (?, ?, ?, ?, ?, ?)`,
    [formData.candregno, formData.fullname, formData.img, formData.subj1, formData.subj2, formData.subj3],
    function(err) {
      if (err) {
        console.error('Error inserting form data into database:', err.message);
        res.status(500).json({ message: 'Error submitting form data' });
      } else {
        console.log('Form data submitted successfully');
        res.status(200).json({ message: 'Form data submitted successfully', formData });
      }
    });
});



//creating new exams examID, timeElapse,candID,status



serVer.post('/api/createexams', (req, res) => {
  const { examID, candID, status ,timeElapse} = req.body; // Destructure the properties from req.body
  
  // Insert the form data into the database
  qdb.run(
    `INSERT INTO exams (examID,timeElapse, candID, status) VALUES (?, ?,?, ?)`,
    [examID, timeElapse,candID, status],
    function(err) {
      if (err) {
        console.error('Error inserting form data into database:', err.message);
        res.status(500).json({ message: 'Error submitting form data' });
      } else {
        console.log('Form data submitted successfully');
        res.status(200).json({ message: 'Form data submitted successfully' });
      }
    }
  );
});



serVer.get('/api/checkexams/:regNo', (req, res) => {
  const { regNo } = req.params;
  
  
  qdb.get('SELECT examID FROM exams WHERE status = ? AND candID = ?',
    ['Ongoing', regNo],
    (err, row) => {
      if (err) {
        console.error('Error retrieving exam:', err);
        res.status(500).json({ error: 'Error retrieving exam' });
      } else {
        const examID = row ? row.examID : null;
        res.json({ examID });
        console.log('Exam ID:', examID);
      }
    }
  );
});






serVer.get('/api/checkcandidate/:regNo', (req, res) => {
  const { regNo } = req.params;
  
  
  db.get('SELECT * FROM candidates WHERE candregno = ?',
    [regNo],
    (err, row) => {
      if (err) {
        console.error('Error retrieving cand:', err);
        res.status(500).json({ error: 'Error retrieving cand' });
      } else {
        const candid = row ? row.candregno : null;
        res.json({ candid });
        console.log('Cand ID:', candid);
      }
    }
  );
});

serVer.get('/api/getexams/:regNo', (req, res) => {
  //returns to history page
  const { regNo } = req.params;
  
  qdb.all('SELECT * FROM exams WHERE candID= ?',
    [regNo],
    (err, row) => {
      if (err) {
        console.error('Error retrieving cand:', err);
        res.status(500).json({ error: 'Error retrieving cand' });
      } else {
        
        res.json({ row });
       // console.log('Cand ID:', candid);
      }
    }
  );
});




//challenges api


serVer.get('/api/challenges', (req, res) => {
  //returns to history page
  
  qdb.all('SELECT * FROM challenges',
    (err, row) => {
      if (err) {
        console.error('Error retrieving cand:', err);
        res.status(500).json({ error: 'Error retrieving cand' });
      } else {
        
        res.json({ row });
       // console.log('Cand ID:', candid);
      }
    }
  );
});


//get all completed challenges

serVer.get('/api/completedchallenges/:regNo', (req, res) => {
  //returns to history page
  const { regNo } = req.params;
  
  qdb.all('SELECT * FROM completedChallenges WHERE candID= ?',
    [regNo],
    (err, row) => {
      if (err) {
        console.error('Error retrieving cand:', err);
        res.status(500).json({ error: 'Error retrieving cand' });
      } else {
        
        res.json({ row });
       // console.log('Cand ID:', candid);
      }
    }
  );
});



serVer.post('/api/storeCompChallenges', (req, res) => {
 
  const { candID, challengeID, completionDate } = req.body;


  const insertQuery = `INSERT INTO completedChallenges (candID, challengeID, completionDate) VALUES (?, ?, ?)`;

  // Execute the SQL query with the provided data
  qdb.run(insertQuery, [candID, challengeID, completionDate], (err) => {
      if (err) {
          console.error('Error inserting data:', err.message);
          // Respond with an error message
          res.status(500).json({ error: 'Error storing challenges' });
      } else {
          console.log('Data inserted successfully');
          // Respond with a success message
          res.json({ message: 'Challenges stored successfully' });
      }
  });
//console.log(candID);

});


serVer.get('/api/subjects', (req, res) => {
  const query = 'SELECT * FROM subjects';

  qdb.all(query, (err, results) => {
    if (err) {
      console.error('Error retrieving subjects:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(results);
  });
});


serVer.get('/api/quizequestions/:subjectId', (req, res) => {
  const { subjectId } = req.params;

  const subjectIdArray = subjectId.split(',');

  // MserVering each subject ID to be wrserVered in single quotes
  const subjectIdParams = subjectIdArray.map(id => `'${id}'`).join(',');
  const query = `SELECT * FROM question WHERE subjID IN (${subjectIdParams})`;


 // console.log(query)
  // Execute the query

  qdb.all(query, (err, results) => {
    if (err) {
      console.error('Error retrieving quiz questions:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
   // console.log(results)
    res.json(results);
  });
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
