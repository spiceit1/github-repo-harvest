
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// GitHub API proxy endpoint
app.get('/api/github/search', async (req, res) => {
  try {
    const { q } = req.query;
    const response = await fetch(`https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching from GitHub API:', error);
    res.status(500).json({ error: 'Failed to fetch data from GitHub API' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
