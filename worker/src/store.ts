import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { BY_ID } from '../../shared/ideas'
import { schema, savedIdea, entitlement } from './db/schema'
import type { Env } from './env'

const db = (env: Env) => drizzle(env.DB, { schema })

export async function listSaved(env: Env, userId: string): Promise<string[]> {
  const rows = await db(env).select({ id: savedIdea.ideaId }).from(savedIdea).where(eq(savedIdea.userId, userId)).orderBy(savedIdea.createdAt)
  return rows.map((r) => r.id).filter((id) => BY_ID.has(id))
}

export async function addSaved(env: Env, userId: string, ids: string[]): Promise<void> {
  const valid = [...new Set(ids)].filter((id) => BY_ID.has(id))
  if (!valid.length) return
  const now = new Date()
  await db(env).insert(savedIdea).values(valid.map((ideaId) => ({ userId, ideaId, createdAt: now }))).onConflictDoNothing()
}

export async function removeSaved(env: Env, userId: string, id: string): Promise<void> {
  await db(env).delete(savedIdea).where(and(eq(savedIdea.userId, userId), eq(savedIdea.ideaId, id)))
}

export async function getPlan(env: Env, userId: string): Promise<'free' | 'pro'> {
  const row = await db(env).select({ plan: entitlement.plan, end: entitlement.currentPeriodEnd }).from(entitlement).where(eq(entitlement.userId, userId)).get()
  if (!row || row.plan !== 'pro') return 'free'
  return !row.end || row.end.getTime() > Date.now() ? 'pro' : 'free'
}

export type Beta = { name: string; platforms: string; status: string; url?: string }
// TestFlight signals come from the catalog Worker's cron snapshot in KV.
export async function readBetas(env: Env): Promise<{ generatedAt: string; apps: Beta[] }> {
  const raw = await env.DATA.get('betas.json')
  if (!raw) return { generatedAt: '', apps: [] }
  try {
    const d = JSON.parse(raw) as { generatedAt: string; apps: Beta[] }
    return { generatedAt: d.generatedAt, apps: d.apps || [] }
  } catch {
    return { generatedAt: '', apps: [] }
  }
}
