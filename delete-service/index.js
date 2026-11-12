const express = require('express');
const { getStudentsCollection, initDb } = require('./db');

const app = express();
app.use(express.json());

const isPositiveStudentId = (id) =>
  /^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0;

async function deleteStudent(req, res, useName) {
  try {
    const value = req.params.idOrName || req.params.name;
    const isId = !useName && /^\d+$/.test(value);
    if (isId && !isPositiveStudentId(value)) {
      return res.status(400).json({ error: 'Student ID must be a positive integer' });
    }

    const collection = getStudentsCollection();
    let studentId;

    if (isId) {
      studentId = Number(value);
    } else {
      const matches = await collection
        .find({ Student_name: value }, { projection: { Student_id: 1, _id: 0 } })
        .limit(2)
        .toArray();
      if (!matches.length) return res.status(404).json({ error: 'Student not found' });
      if (matches.length > 1) {
        return res.status(409).json({ error: 'Multiple students have this name; delete by student ID' });
      }
      studentId = matches[0].Student_id;
    }

    const result = await collection.deleteOne({ Student_id: studentId });
    if (!result.deletedCount) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: `Student ${studentId} deleted` });
  } catch (error) {
    console.error('Student deletion failed:', error.message);
    res.status(500).json({ error: 'Student deletion failed' });
  }
}

app.delete('/students/:idOrName', (req, res) => deleteStudent(req, res, false));
app.delete('/students/name/:name', (req, res) => deleteStudent(req, res, true));

app.get('/health', (req, res) => res.json({ status: 'delete-service ok' }));

initDb()
  .then(() => app.listen(3002, () => console.log('Delete service on port 3002')))
  .catch((error) => {
    console.error('Delete service could not connect to MongoDB Atlas:', error.message);
    process.exit(1);
  });
