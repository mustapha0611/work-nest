import { argon2id, hash, verify, type HashOptions } from 'argon2';

/**
 * Password hashing.
 *
 * argon2id is the current recommendation from OWASP and the winner of the
 * Password Hashing Competition. Unlike SHA-256, it is deliberately slow and
 * memory-hungry, because passwords are low-entropy secrets that can be guessed:
 * the defender's job is to make each guess expensive.
 *
 * These are the library defaults, written out so the cost is reviewable in one
 * place instead of being an invisible default. Raising `memoryCost` raises the
 * attacker's cost and your own per-login cost equally — measure before changing.
 */
const HASH_OPTIONS: HashOptions = {
  type: argon2id,
  memoryCost: 65536, // 64 MiB
  timeCost: 3,
  parallelism: 4,
};

/**
 * A real argon2id hash of a value nobody knows.
 *
 * Used when the email does not exist: verifying against this spends the same
 * time as verifying a real account, so response timing cannot be used to ask
 * "does this email have an account?".
 */
const ABSENT_ACCOUNT_HASH =
  '$argon2id$v=19$m=65536,p=4,t=3$S5q2GJId2/tn+q0FhIdc4A$38mW/Osumd9ypwGUYzNXO7J4A+sBSLHJtptr/6SGbCI';

export function hashPassword(password: string): Promise<string> {
  return hash(password, HASH_OPTIONS);
}

/**
 * Never throws on a malformed stored hash: a corrupted row means "this password
 * does not match", not "the server crashed".
 */
export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

/** Spends a verification's worth of time without revealing anything. */
export async function spendPasswordVerificationTime(password: string): Promise<void> {
  await verifyPassword(ABSENT_ACCOUNT_HASH, password);
}
