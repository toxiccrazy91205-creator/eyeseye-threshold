import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import experimentRoutes from './routes/experimentRoutes.js';
import dataRoutes from './routes/dataRoutes.js';
import formRoutes from './routes/formRoutes.js';
import calibrationRoutes from './routes/calibrationRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/experiments', experimentRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/calibration', calibrationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('CRITICAL: MONGODB_URI is not defined in the environment variables!');
  process.exit(1);
}
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API Health Check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('CRITICAL: MongoDB connection error!');
    console.error('Error details:', err.message);
    if (err.message.includes('auth failed')) {
      console.error('Recommendation: Check your MONGODB_URI credentials in .env');
    }
    process.exit(1);
  });

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});