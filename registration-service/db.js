const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI environment variable is required');
}

const client = new MongoClient(uri);
const databaseName = process.env.MONGODB_DB_NAME || 'college';

async function initDb(retries = 30) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await client.connect();
      const database = client.db(databaseName);
      const collection = database.collection('students');
      await collection.createIndex({ student_email: 1 }, { unique: true });
      await collection.createIndex({ Student_id: 1 }, { unique: true });
      const highestStudent = await collection
        .find({ Student_id: { $type: 'number' } })
        .sort({ Student_id: -1 })
        .limit(1)
        .next();
      await database.collection('counters').updateOne(
        { _id: 'student_id' },
        { $max: { sequence: highestStudent ? highestStudent.Student_id : 0 } },
        { upsert: true }
      );
      console.log('MongoDB Atlas ready');
      return;
    } catch (error) {
      lastError = error;
      console.log(`Waiting for MongoDB Atlas... (${attempt}/${retries})`);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  throw lastError;
}

function getStudentsCollection() {
  return client.db(databaseName).collection('students');
}

async function getNextStudentId() {
  const counter = await client.db(databaseName).collection('counters').findOneAndUpdate(
    { _id: 'student_id' },
    { $inc: { sequence: 1 } },
    { upsert: true, returnDocument: 'after', includeResultMetadata: false }
  );
  return counter.sequence;
}

module.exports = { getNextStudentId, getStudentsCollection, initDb };
