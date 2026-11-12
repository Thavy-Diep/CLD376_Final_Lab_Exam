const express = require('express');
const bcrypt = require('bcryptjs');
const { getNextStudentId, getStudentsCollection, initDb } = require('./db');

const app = express();
app.use(express.json());

const PUBLIC_FIELDS = {
  projection: { _id: 0, Student_id: 1, Student_name: 1, student_mobile: 1, student_email: 1 },
};
const isPositiveStudentId = (id) =>
  /^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0;

// CREATE - register student
app.post('/students', async (req, res) => {
  const { student_name, student_mobile, student_email, student_password } = req.body;
  if (!student_name || !student_mobile || !student_email || !student_password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const hash = await bcrypt.hash(student_password, 10);
    const studentId = await getNextStudentId();
    await getStudentsCollection().insertOne({
      Student_id: studentId,
      Student_name: student_name,
      student_mobile,
      student_email,
      student_password: hash,
    });
    res.status(201).json({ message: 'Student registered', student_id: studentId });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'Email already exists' });
    console.error('Student registration failed:', error.message);
    res.status(500).json({ error: 'Student registration failed' });
  }
});

// READ - all students
app.get('/students', async (req, res) => {
  try {
    const students = await getStudentsCollection().find({}, PUBLIC_FIELDS).toArray();
    res.json(students);
  } catch (error) {
    console.error('Could not retrieve students:', error.message);
    res.status(500).json({ error: 'Could not retrieve students' });
  }
});

// READ - one student
app.get('/students/:id', async (req, res) => {
  if (!isPositiveStudentId(req.params.id)) {
    return res.status(400).json({ error: 'Student ID must be a positive integer' });
  }
  try {
    const student = await getStudentsCollection().findOne(
      { Student_id: Number(req.params.id) },
      PUBLIC_FIELDS
    );
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (error) {
    console.error('Could not retrieve student:', error.message);
    res.status(500).json({ error: 'Could not retrieve student' });
  }
});

// UPDATE
app.put('/students/:id', async (req, res) => {
  if (!isPositiveStudentId(req.params.id)) {
    return res.status(400).json({ error: 'Student ID must be a positive integer' });
  }
  const { student_name, student_mobile, student_email } = req.body;
  try {
    const result = await getStudentsCollection().updateOne(
      { Student_id: Number(req.params.id) },
      { $set: { Student_name: student_name, student_mobile, student_email } }
    );
    if (!result.matchedCount) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student updated' });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'Email already exists' });
    console.error('Student update failed:', error.message);
    res.status(500).json({ error: 'Student update failed' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'registration-service ok' }));

initDb()
  .then(() => app.listen(3001, () => console.log('Registration service on port 3001')))
  .catch((error) => {
    console.error('Registration service could not connect to MongoDB Atlas:', error.message);
    process.exit(1);
  });
