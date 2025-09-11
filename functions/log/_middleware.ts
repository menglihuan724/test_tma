export interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  try {
    const result = await context.env.faku.prepare("SELECT * FROM uni_log").all();
    return new Response(JSON.stringify({ data: result.results }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "query failed" }), { status: 500, headers: { "content-type": "application/json" } });
  }
};

