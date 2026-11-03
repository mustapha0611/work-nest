import { HttpError } from '../../lib/http-error.js';
import { spendPasswordVerificationTime, verifyPassword } from '../../lib/password.js';
import { getPrismaClient } from '../../lib/prisma.js';
import { toPublicUser, type PublicUser } from './auth.types.js';

/**
 * One message for every failure.
 *
 * "No such account", "wrong password" and "this account is deactivated" must be
 * indistinguishable, or the endpoint becomes a free account-existence oracle.
 */
const INVALID_CREDENTIALS_MESSAGE = 'Email or password is incorrect.';

function invalidCredentials(): HttpError {
  return new HttpError(401, 'INVALID_CREDENTIALS', INVALID_CREDENTIALS_MESSAGE);
}

/**
 * Checks a password and returns the matching user.
 *
 * Emails are normalised on the way in, matching what the schema stores: the
 * unique index is case-sensitive, so normalisation is what makes
 * `Alice@x.com` and `alice@x.com` the same account.
 */
export async function authenticateUser(email: string, password: string): Promise<PublicUser> {
  const user = await getPrismaClient().user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    // Spend the same time as a real verification before failing, so response
    // timing cannot distinguish "no such account" from "wrong password".
    await spendPasswordVerificationTime(password);
    throw invalidCredentials();
  }

  const passwordMatches = await verifyPassword(user.passwordHash, password);

  if (!passwordMatches || user.deactivatedAt !== null) {
    throw invalidCredentials();
  }

  return toPublicUser(user);
}
