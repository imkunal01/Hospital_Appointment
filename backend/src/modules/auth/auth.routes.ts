import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../config/db.js';
import { validate } from '../../middleware/validate.js';
import { loginRateLimiter } from '../../middleware/rateLimit.js';
import { requireAuth } from '../../middleware/auth.js';
import {
  loginSchema,
  registerSchema,
  googleAuthSchema,
  refreshSchema,
  logoutSchema
} from './auth.schema.js';
import {
  loginUser,
  registerUser,
  googleAuthUser,
  getCurrentUser,
  refreshAccessToken,
  logoutUser
} from './auth.service.js';

export const authRouter = Router();

// POST /auth/login - Authenticate with email/password
authRouter.post(
  '/login',
  loginRateLimiter(),
  validate({ body: loginSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await loginUser(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /auth/register - Register with email/password
authRouter.post(
  '/register',
  loginRateLimiter(),
  validate({ body: registerSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await registerUser(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /auth/google - Authenticate / register via Google OAuth
authRouter.post(
  '/google',
  loginRateLimiter(),
  validate({ body: googleAuthSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await googleAuthUser(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /auth/me - Fetch currently authenticated user profile
authRouter.get(
  '/me',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getCurrentUser(req.user!.userId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /auth/refresh - Exchange refresh token for fresh access token
authRouter.post(
  '/refresh',
  validate({ body: refreshSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await refreshAccessToken(req.body.refreshToken);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /auth/logout - Revoke refresh token
authRouter.post(
  '/logout',
  validate({ body: logoutSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await logoutUser(req.body.refreshToken);
      res.status(200).json({
        success: true,
        message: 'Successfully logged out'
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /auth/reset-demo - Resets patient1@example.test to fresh onboarding state for evaluators
authRouter.post(
  '/reset-demo',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await query(
        `UPDATE users 
         SET onboarding_completed = FALSE, 
             phone_verified = FALSE, 
             phone = NULL, 
             dob = NULL, 
             location = NULL 
         WHERE email = 'patient1@example.test'
         RETURNING id, email, onboarding_completed, phone, phone_verified`
      );
      res.status(200).json({
        success: true,
        message: 'Evaluator account reset to fresh onboarding state',
        user: result.rows[0]
      });
    } catch (err) {
      next(err);
    }
  }
);
