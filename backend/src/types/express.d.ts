import type { PublicUser } from '../modules/auth/auth.types.js';

/**
 * Express request augmentation.
 *
 * `requireAuth` is the only writer. Reading `req.user` in a handler that is not
 * behind it is a type error, which is exactly the reminder you want.
 */
declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

export {};
