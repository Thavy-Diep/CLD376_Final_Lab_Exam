const express = require('express');
const bcrypt = require('bcryptjs');
const { pool, initDb } = require('./db');

const app = express();
app.use(express.json());

const COLS = 'Student_id, Student_name, student_mobile, student_email'; // never return password

// CREATE - register student
app.post('/students', async (req, res) => {
  const { student_name, student_mobile, student_email, student_password } = req.body;
  if (!student_name || !student_mobile || !student_email || !student_password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const hash = await bcrypt.hash(student_password, 10);
    const [result] = await pool.query(
      'INSERT INTO students (Student_name, student_mobile, student_email, student_password) VALUES (?, ?, ?, ?)',
      [student_name, student_mobile, student_email, hash]
    );
    res.status(201).json({ message: 'Student registered', student_id: result.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: e.message });
  }
});

// READ - all students
app.get('/students', async (req, res) => {
  const [rows] = await pool.query(`SELECT ${COLS} FROM students`);
  res.json(rows);
});

// READ - one student
app.get('/students/:id', async (req, res) => {
  const [rows] = await pool.query(`SELECT ${COLS} FROM students WHERE Student_id = ?`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Student not found' });
  res.json(rows[0]);
});

// UPDATE
app.put('/students/:id', async (req, res) => {
  const { student_name, student_mobile, student_email } = req.body;
  const [result] = await pool.query(
    'UPDATE students SET Student_name = ?, student_mobile = ?, student_email = ? WHERE Student_id = ?',
    [student_name, student_mobile, student_email, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Student not found' });
  res.json({ message: 'Student updated' });
});

app.get('/health', (req, res) => res.json({ status: 'registration-service ok' }));

initDb().then(() => app.listen(3001, () => console.log('Registration service on port 3001')));
