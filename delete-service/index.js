const express = require('express');
const { pool, initDb } = require('./db');

const app = express();
app.use(express.json());

app.delete('/students/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM students WHERE Student_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: `Student ${req.params.id} deleted` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'delete-service ok' }));

initDb().then(() => app.listen(3002, () => console.log('Delete service on port 3002')));
