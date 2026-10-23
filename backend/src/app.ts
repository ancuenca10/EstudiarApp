import express from 'express';
import cors from 'cors';

import universityRoutes from './routes/universities';
import authRoutes from './routes/auth';
import searchRoutes from './routes/search';
import userRoutes from './routes/users';
import programRoutes from './routes/programRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import reviewRoutes from './routes/reviewRoutes';
import parametrizacionRoutes from './routes/parametrizacionRoutes';
import importAssistantRoutes from './routes/importAssistantRoutes';
import universityPanelRoutes from './routes/universityPanelRoutes';
import notificationRoutes from './routes/notificationRoutes';
import publicRoutes from './routes/publicRoutes';
import becaRoutes from './routes/becaRoutes';
import systemSettingsRoutes from './routes/systemSettingsRoutes';
import studentRoutes from './routes/studentRoutes';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = env.port;

app.use(cors({
  origin: env.frontendUrl,
  credentials: true,
}));
app.use(express.json());

app.use('/api/universidades', universityRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/programas', programRoutes);
app.use('/api/favoritos', favoriteRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/parametrizacion', parametrizacionRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/import-assistant', importAssistantRoutes);
app.use('/api/university-panel', universityPanelRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/becas', becaRoutes);
app.use('/api/system-settings', systemSettingsRoutes);
app.use('/api/student', studentRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    message: 'API funcionando correctamente',
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
