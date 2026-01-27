export default {
  async fetch(request) {
    const url = new URL(request.url);
    const body = {
      ok: true,
      message: 'hello from Alternate Futures function',
      method: request.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      now: new Date().toISOString(),
    };

    return new Response(JSON.stringify(body, null, 2), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
    });
  },
};

