import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Importar rutas
import universityRoutes from './routes/universities';
import authRoutes from './routes/auth';
import searchRoutes from './routes/search';

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // URL exacta del frontend
  credentials: true
}));

// ✅ USAR PUERTO DIFERENTE SI 3000 ESTÁ OCUPADO
const PORT = process.env.PORT || 3001; // Cambiado a 3001

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/estudiarapp')
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// Rutas
app.use('/api/universities', universityRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'API funcionando correctamente', 
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});