/**
 * Cloudflare Worker (static assets) for the portfolio site.
 * Serves the static files and handles POST /friend-counter against D1
 * (atomic increment) - the free replacement for AWS Lambda + DynamoDB.
 */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '300',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/friend-counter') {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS });
      }
      if (request.method === 'POST') {
        try {
          const row = await env.DB.prepare(
            "INSERT INTO counters (counter_id, visits) VALUES ('friend-counter', 1) " +
            'ON CONFLICT(counter_id) DO UPDATE SET visits = visits + 1 RETURNING visits'
          ).first();
          return new Response(JSON.stringify({ count: row.visits }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (e) {
          console.log(e);
          return new Response(JSON.stringify({ error: 'Could not update counter' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // Everything else: static assets.
    return env.ASSETS.fetch(request);
  },
};
