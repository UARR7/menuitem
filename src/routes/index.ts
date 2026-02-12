import { Router, Request, Response } from 'express';
import categoryRoutes from './category.routes';
import menuItemRoutes from './menuItem.routes';

const router = Router();

// Health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/categories', categoryRoutes);
router.use('/menu-items', menuItemRoutes);

export default router;
