const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI est manquant. Définissez-le dans votre fichier .env avant de démarrer le backend.');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    console.error('Please ensure MongoDB is running and accessible at', process.env.MONGODB_URI || 'your configured MONGODB_URI');
    process.exit(1);
  }
};
// ...existing code...
module.exports = connectDB;
// ...existing code...
