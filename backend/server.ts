import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { getMaterials, getDashboardSummary, getMaterialDetail } from '../lib/db';

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.resolve(process.cwd(), 'public/uploads')));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'RAP Material Control Backend' });
});

// Materials API
app.get('/api/materials', async (req: Request, res: Response) => {
  try {
    const materials = await getMaterials(req.query as any);
    res.json({ materials });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/materials/:id/detail', async (req: Request, res: Response) => {
  try {
    const detail = await getMaterialDetail(Number(req.params.id));
    if (!detail) return res.status(404).json({ error: 'Material not found' });
    res.json(detail);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard API
app.get('/api/dashboard/summary', async (req: Request, res: Response) => {
  try {
    const summary = await getDashboardSummary(Number(req.query.projectId) || 1);
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default app;

if (process.env.NODE_ENV !== 'test' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`RAP Material Control backend listening on port ${PORT}`);
  });
}
