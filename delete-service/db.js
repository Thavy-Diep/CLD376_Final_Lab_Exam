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

module.exports = { getStudentsCollection, initDb };
