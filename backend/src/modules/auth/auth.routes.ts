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
  logoutSchema,
  updateUserProfileSchema
} from './auth.schema.js';
import {
  loginUser,
  registerUser,
  googleAuthUser,
  getCurrentUser,
  updateUserProfile,
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

// PUT /auth/profile - Update personal information
authRouter.put(
  '/profile',
  requireAuth,
  validate({ body: updateUserProfileSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await updateUserProfile(req.user!.userId, req.body);
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
             location = NULL,
             avatar_url = NULL,
             name = 'John Doe (Synthetic)',
             password_hash = '$2b$10$igkQKasz2eImnyB8EZYzhuc5FFwAx2/wMK/JVBdLwigP2FQyA0/VO'
         WHERE email = 'patient1@example.test'
         RETURNING id, email, name, onboarding_completed, phone, phone_verified`
      );

      const patient = result.rows[0];
      if (patient) {
        const apts = await query(
          `SELECT slot_id FROM appointments 
           WHERE patient_id = $1 AND id != 'b1111111-1111-1111-1111-111111111111'`,
          [patient.id]
        );
        const slotIds = apts.rows.map(r => r.slot_id).filter(Boolean);
        if (slotIds.length > 0) {
          await query(
            `UPDATE slots SET status = 'AVAILABLE' WHERE id = ANY($1::uuid[])`,
            [slotIds]
          );
        }
        await query(
          `DELETE FROM appointments 
           WHERE patient_id = $1 AND id != 'b1111111-1111-1111-1111-111111111111'`,
          [patient.id]
        );
        await query('DELETE FROM phone_verifications WHERE user_id = $1', [patient.id]);
        await query('DELETE FROM refresh_tokens WHERE user_id = $1', [patient.id]);
      }

      res.status(200).json({
        success: true,
        message: 'Evaluator account reset to fresh onboarding state',
        user: patient
      });
    } catch (err) {
      next(err);
    }
  }
);
