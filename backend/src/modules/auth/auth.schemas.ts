import { z } from 'zod';

/**
 * Sign-in input.
 *
 * The password is checked for presence and a sane upper bound only. Enforcing
 * a password policy here would reject existing passwords the day the policy
 * changes, and would leak the policy to anyone probing the endpoint. The upper
 * bound exists because hashing is deliberately expensive: an unbounded field is
 * an invitation to spend the server's memory on a 10 MB "password".
 */
export const loginSchema = z.object({
  // Trim before validating: a padded address is a typing accident, not an
  // invalid account. Case is normalised in the service, next to the lookup.
  email: z.string().trim().pipe(z.email().max(320)),
  password: z.string().min(1).max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;
