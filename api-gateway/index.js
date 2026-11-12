const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Same pod -> localhost; other pod -> Kubernetes Service name
const REGISTRATION_URL = process.env.REGISTRATION_URL || 'http://localhost:3001';
const DELETE_URL = process.env.DELETE_URL || 'http://delete-service:3002';

const forward = (baseUrl) => async (req, res) => {
  try {
    const r = await axios({
      method: req.method,
      url: baseUrl + req.originalUrl,
      data: req.body,
      validateStatus: () => true,
    });
    res.status(r.status).json(r.data);
  } catch (err) {
    res.status(502).json({ error: 'Downstream service unavailable' });
  }
};

const toRegistration = forward(REGISTRATION_URL);
const toDelete = forward(DELETE_URL);

app.get('/health', (req, res) => res.json({ status: 'api-gateway ok' }));

// Registration microservice (create / read / update)
app.post('/students', toRegistration);
app.get('/students', toRegistration);
app.get('/students/:id', toRegistration);
app.put('/students/:id', toRegistration);

// Delete microservice
app.delete('/students/:id', toDelete);

app.listen(3000, () => console.log('API Gateway running on port 3000'));
