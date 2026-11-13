import { createMcpHandler } from 'agents/mcp'
import { McpServer } from '@modelcontextprotocol/server'
import { z } from 'zod'
import { BY_ID, CATEGORIES, IDEAS, type Idea } from '../../shared/ideas'
import { query, FILTERS, type Filter } from '../../shared/search'
import { related, sharedTraits } from '../../shared/similarity'
import { synthesize, type ClusterMode } from '../../shared/synthesis'
import { addSaved, listSaved, readBetas, removeSaved } from './store'
import type { Env, McpProps } from './env'

const brief = (i: Idea) => ({ id: i.id, title: i.title, pitch: i.pitch, category: i.category, effort: i.effort, ai: i.ai })
const text = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] })

// The App Idea Store MCP server. Every call runs as the signed-in user who
// approved the connection (props from their OAuth token), so saves made from
// Claude or Cursor show up on the site and the other way round.
function buildServer(env: Env, props: McpProps) {
  const ideas = new McpServer({ name: 'App Idea Store', version: '0.1.0' })
  registerTools({ env, userId: props.userId, ideas })
  return ideas
}

type Ctx = { env: Env; userId: string; ideas: McpServer }

function registerTools({ env, userId, ideas }: Ctx) {
    ideas.registerTool(
      'search_ideas',
      {
        title: 'Search app ideas',
        description: 'Search the App Idea Store library by words in the problem, audience, job or tech. Optional filter narrows by category, platform or build size.',
        inputSchema: z.object({
          query: z.string().default('').describe('Words to search for, e.g. "receipts" or "HealthKit"'),
          filter: z.enum(FILTERS as [Filter, ...Filter[]]).optional().describe('One of the library filters'),
          limit: z.number().int().min(1).max(50).default(12),
        }),
        annotations: { readOnlyHint: true },
      },
      async ({ query: q, filter, limit }) => {
        const saved = await listSaved(env, userId)
        return text(query(q, filter ?? 'For You', 'Relevance', saved).slice(0, limit).map(brief))
      },
    )

    ideas.registerTool(
      'get_idea',
      {
        title: 'Get an idea',
        description: 'Full structured brief for one idea: problem, audience, job to steal, features, tech, platforms, build size, business model and related ideas.',
        inputSchema: z.object({ id: z.string().describe('Idea id from search_ideas, e.g. "voice-journal"') }),
        annotations: { readOnlyHint: true },
      },
      async ({ id }) => {
        const idea = BY_ID.get(id)
        if (!idea) return { ...text({ error: `No idea with id ${id}` }), isError: true }
        return text({ ...idea, related: related(idea, 4).map((r) => ({ ...brief(r), shares: sharedTraits(idea, r) })) })
      },
    )

    ideas.registerTool(
      'list_saved_ideas',
      { title: 'List my saved ideas', description: 'Ideas the user has saved to their collection.', annotations: { readOnlyHint: true } },
      async () => text((await listSaved(env, userId)).map((id) => brief(BY_ID.get(id)!))),
    )

    ideas.registerTool(
      'save_idea',
      { title: 'Save an idea', description: 'Add an idea to the user’s collection.', inputSchema: z.object({ id: z.string() }) },
      async ({ id }) => {
        if (!BY_ID.has(id)) return { ...text({ error: `No idea with id ${id}` }), isError: true }
        await addSaved(env, userId, [id])
        return text({ saved: id })
      },
    )

    ideas.registerTool(
      'remove_saved_idea',
      { title: 'Remove a saved idea', description: 'Remove an idea from the user’s collection.', inputSchema: z.object({ id: z.string() }), annotations: { destructiveHint: true } },
      async ({ id }) => {
        await removeSaved(env, userId, id)
        return text({ removed: id })
      },
    )

    ideas.registerTool(
      'synthesize_saved_ideas',
      {
        title: 'Synthesize my saved ideas',
        description: 'Groups the user’s saved ideas into themes, lists shared threads, and proposes a combined concept where two themes overlap. Needs at least 3 saved ideas.',
        inputSchema: z.object({ groupBy: z.enum(['category', 'problem', 'technology']).default('category') }),
        annotations: { readOnlyHint: true },
      },
      async ({ groupBy }) => {
        const ideas = (await listSaved(env, userId)).map((id) => BY_ID.get(id)!).filter(Boolean)
        const s = synthesize(ideas, groupBy as ClusterMode)
        if (!s) return text({ message: `Save at least 3 ideas first (you have ${ideas.length}).` })
        return text({
          themes: s.themes.map((t) => ({ name: t.name, share: t.share, ideas: t.ideas.map((i) => i.id) })),
          threads: s.threads,
          intersection: s.intersection && { between: [s.intersection.a, s.intersection.b], from: s.intersection.bridge.map((i) => i.id), concept: s.intersection.concept },
          closeToWhatYouSaved: s.missed.map(brief),
        })
      },
    )

    ideas.registerTool(
      'testflight_signals',
      {
        title: 'TestFlight signals',
        description: 'Public TestFlight betas indexed by App Idea Store, with whether each is open or full. Use to see what is being built before it reaches the App Store.',
        inputSchema: z.object({
          query: z.string().default('').describe('Filter by words in the app name'),
          status: z.enum(['open', 'full', 'any']).default('any'),
          limit: z.number().int().min(1).max(100).default(25),
        }),
        annotations: { readOnlyHint: true },
      },
      async ({ query: q, status, limit }) => {
        const { generatedAt, apps } = await readBetas(env)
        const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
        const hits = apps
          .filter((a) => status === 'any' || a.status === status)
          .filter((a) => terms.every((t) => a.name.toLowerCase().includes(t)))
          .slice(0, limit)
        return text({ generatedAt, total: apps.length, results: hits })
      },
    )

    ideas.registerResource(
      'categories',
      'ideas://categories',
      { title: 'Idea categories', mimeType: 'application/json' },
      async (uri) => ({
        contents: [{ uri: uri.href, text: JSON.stringify(CATEGORIES.map((c) => ({ category: c, ideas: IDEAS.filter((i) => i.category === c).length }))) }],
      }),
    )
}

// Stateless Streamable HTTP: a fresh server per request, bound to the token's user.
export const mcpApiHandler = {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const props = (ctx as ExecutionContext & { props?: McpProps }).props
    if (!props?.userId) return new Response('Unauthorized', { status: 401 })
    return createMcpHandler(() => buildServer(env, props), { route: '/mcp' })(request, env, ctx)
  },
}
