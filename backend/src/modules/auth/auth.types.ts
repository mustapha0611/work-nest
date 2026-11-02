/**
 * The shape of a user as the API is allowed to expose it.
 *
 * Kept separate from the database record on purpose: the row carries
 * `passwordHash`, and a mapper is the only place that decides what leaves the
 * process. Returning the Prisma object directly would leak it the first time
 * someone adds a field.
 */
export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export function toPublicUser(user: {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt.toISOString(),
  };
}
