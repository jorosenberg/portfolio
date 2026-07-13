/**
 * Cloudflare Pages Function — friend counter
 * 1:1 replacement for the AWS Lambda + DynamoDB counter:
 *   POST /friend-counter  →  atomically increments and returns { count }
 *
 * DynamoDB UpdateItem(ADD visits 1)  →  D1 atomic UPDATE ... RETURNING.
 * Served same-origin by Pages, so CORS headers are no longer required,
 * but OPTIONS is kept for parity with the old API Gateway CORS config.
 */

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function onRequestPost({ env }) {
  try {
    const row = await env.DB.prepare(
      `INSERT INTO counters (counter_id, visits) VALUES ('friend-counter', 1)
       ON CONFLICT(counter_id) DO UPDATE SET visits = visits + 1
       RETURNING visits`
    ).first();

    return new Response(JSON.stringify({ count: row.visits }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (e) {
    console.log(e);
    return new Response(JSON.stringify({ error: 'Could not update counter' }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '300',
    },
  });
}
