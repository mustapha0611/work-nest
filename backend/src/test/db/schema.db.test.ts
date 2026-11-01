import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { createPrismaClient } from '../../lib/prisma.js';
import { resolveTestDatabaseUrl } from './test-env.js';

/**
 * These tests exercise the schema, not an API. They are the only place where a
 * real PostgreSQL is required, which is why they are named `*.db.test.ts` and
 * run through `npm run test:db` instead of `npm test`.
 */
const prisma = createPrismaClient(resolveTestDatabaseUrl());

/**
 * Empties every table between cases.
 *
 * Deletion order is children first: `Task.createdById` is `RESTRICT`, so users
 * cannot be removed while tasks still reference them. Tests are allowed to hard
 * delete — the no-hard-delete rule is a product rule enforced by the absence of
 * delete endpoints, not by the schema.
 */
async function resetDatabase(): Promise<void> {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();
}

async function createUser(email: string) {
  return prisma.user.create({
    data: {
      email,
      passwordHash: 'not-a-real-hash',
      displayName: email.split('@')[0] ?? email,
    },
  });
}

async function createWorkspace(slug: string) {
  return prisma.workspace.create({ data: { name: slug, slug } });
}

async function createProject(workspaceId: string) {
  return prisma.project.create({ data: { workspaceId, name: 'Launch' } });
}

beforeEach(resetDatabase);

afterAll(async () => {
  await prisma.$disconnect();
});

describe('schema', () => {
  it('stores a workspace, membership, project and task with their relations', async () => {
    const user = await createUser('alice@worknest.test');
    const workspace = await createWorkspace('acme');
    await prisma.membership.create({ data: { workspaceId: workspace.id, userId: user.id } });
    const project = await createProject(workspace.id);
    const task = await prisma.task.create({
      data: {
        projectId: project.id,
        title: 'Write the brief',
        createdById: user.id,
        assigneeId: user.id,
      },
    });

    const loaded = await prisma.task.findUniqueOrThrow({
      where: { id: task.id },
      include: {
        assignee: true,
        project: { include: { workspace: { include: { memberships: true } } } },
      },
    });

    expect(loaded.title).toBe('Write the brief');
    expect(loaded.status).toBe('TODO');
    expect(loaded.priority).toBe('MEDIUM');
    expect(loaded.project.status).toBe('ACTIVE');
    expect(loaded.project.workspace.slug).toBe('acme');
    expect(loaded.project.workspace.memberships).toHaveLength(1);
    expect(loaded.project.workspace.memberships[0]?.role).toBe('MEMBER');
    expect(loaded.assignee?.email).toBe('alice@worknest.test');
  });

  it('generates sortable UUID v7 identifiers', async () => {
    const first = await createUser('a@worknest.test');
    const second = await createUser('b@worknest.test');

    // Position 14 is the version nibble in the canonical UUID layout.
    expect(first.id[14]).toBe('7');
    expect(second.id[14]).toBe('7');
    // v7 embeds a millisecond timestamp, so lexical order matches creation order.
    expect(first.id < second.id).toBe(true);
  });

  it('rejects a second membership for the same user and workspace', async () => {
    const user = await createUser('bob@worknest.test');
    const workspace = await createWorkspace('beta');
    await prisma.membership.create({ data: { workspaceId: workspace.id, userId: user.id } });

    const duplicate = prisma.membership.create({
      data: { workspaceId: workspace.id, userId: user.id, role: 'ADMIN' },
    });

    await expect(duplicate).rejects.toMatchObject({ code: 'P2002' });
    expect(await prisma.membership.count()).toBe(1);
  });

  it('treats email as a unique account key', async () => {
    await createUser('carol@worknest.test');

    await expect(createUser('carol@worknest.test')).rejects.toMatchObject({ code: 'P2002' });
  });

  it('keeps a task when its assignee is deleted, clearing the assignment', async () => {
    const owner = await createUser('owner@worknest.test');
    const assignee = await createUser('assignee@worknest.test');
    const workspace = await createWorkspace('gamma');
    const project = await createProject(workspace.id);
    const task = await prisma.task.create({
      data: {
        projectId: project.id,
        title: 'Review the plan',
        createdById: owner.id,
        assigneeId: assignee.id,
      },
    });

    await prisma.user.delete({ where: { id: assignee.id } });

    const after = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
    expect(after.assigneeId).toBeNull();
  });

  it('refuses to delete a user who created tasks', async () => {
    const author = await createUser('author@worknest.test');
    const workspace = await createWorkspace('delta');
    const project = await createProject(workspace.id);
    await prisma.task.create({
      data: { projectId: project.id, title: 'Owned work', createdById: author.id },
    });

    await expect(prisma.user.delete({ where: { id: author.id } })).rejects.toMatchObject({
      code: 'P2003',
    });
    expect(await prisma.user.count()).toBe(1);
  });

  it('removes memberships, projects and tasks when a workspace is deleted', async () => {
    const user = await createUser('dana@worknest.test');
    const workspace = await createWorkspace('epsilon');
    await prisma.membership.create({ data: { workspaceId: workspace.id, userId: user.id } });
    const project = await createProject(workspace.id);
    await prisma.task.create({
      data: { projectId: project.id, title: 'Cascade me', createdById: user.id },
    });

    await prisma.workspace.delete({ where: { id: workspace.id } });

    expect(await prisma.membership.count()).toBe(0);
    expect(await prisma.project.count()).toBe(0);
    expect(await prisma.task.count()).toBe(0);
    // The user is not owned by the workspace and must survive.
    expect(await prisma.user.count()).toBe(1);
  });

  it('keeps soft-deleted tasks in the table but out of a deletedAt: null filter', async () => {
    const user = await createUser('erin@worknest.test');
    const workspace = await createWorkspace('zeta');
    const project = await createProject(workspace.id);
    const task = await prisma.task.create({
      data: { projectId: project.id, title: 'Dropped work', createdById: user.id },
    });

    await prisma.task.update({ where: { id: task.id }, data: { deletedAt: new Date() } });

    const visible = await prisma.task.findMany({
      where: { projectId: project.id, deletedAt: null },
    });

    expect(visible).toHaveLength(0);
    expect(await prisma.task.count()).toBe(1);
  });
});
