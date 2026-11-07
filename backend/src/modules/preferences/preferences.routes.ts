import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { updatePreferencesSchema } from './preferences.schema.js';
import {
  getUserPreferences,
  updateUserPreferences
} from './preferences.service.js';

export const preferencesRouter = Router();

// GET /me/preferences - Retrieve current user's reminder preferences
preferencesRouter.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const prefs = await getUserPreferences(userId);
      res.status(200).json(prefs);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /me/preferences - Update user's reminder preferences
preferencesRouter.put(
  '/',
  requireAuth,
  validate({ body: updatePreferencesSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const updated = await updateUserPreferences(userId, req.body);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
);

