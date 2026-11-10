import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  sendOtpSchema,
  verifyOtpSchema,
  updateProfileSchema
} from './onboarding.schema.js';
import {
  sendPhoneOtp,
  verifyPhoneOtp,
  updateOnboardingProfile
} from './onboarding.service.js';

export const onboardingRouter = Router();

// All onboarding endpoints require an authenticated session
onboardingRouter.use(requireAuth);

// POST /onboarding/phone/send-otp
onboardingRouter.post(
  '/phone/send-otp',
  validate({ body: sendOtpSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await sendPhoneOtp(req.user!.userId, req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /onboarding/phone/verify-otp
onboardingRouter.post(
  '/phone/verify-otp',
  validate({ body: verifyOtpSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await verifyPhoneOtp(req.user!.userId, req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /onboarding/profile
onboardingRouter.put(
  '/profile',
  validate({ body: updateProfileSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await updateOnboardingProfile(req.user!.userId, req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

