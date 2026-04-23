/**
 * CoinMarketCap API 代理中间件
 * 路径格式: /coin/v1/simple/price?ids=1
 */
export const onRequest = async ({ request, env }) => {
  const url = new URL(request.url);

  // 转换路径: /coin/v1/xxx → /v1/xxx
  const cmcPath = url.pathname.replace(/^\/coin/, '');
  const targetUrl = `https://pro-api.coinmarketcap.com${cmcPath}${url.search}`;

  console.log(`[Coin] ${request.method} ${url.pathname}${url.search} → ${targetUrl}`);

  // 构建请求头
  const headers = new Headers(request.headers);
  headers.delete('Host');
  headers.delete('cf-connecting-ip');

  // 从请求头获取 API Key（前端通过 VITE_COINMARKETCAP_API_KEY 配置）
  // 或者从 env 读取（Cloudflare Pages 环境变量）
  const apiKey = request.headers.get('X-CMC_PRO_API_KEY') || '';
  headers.set('X-CMC_PRO_API_KEY', apiKey);

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: ['POST', 'PUT', 'PATCH'].includes(request.method)
        ? await request.text()
        : undefined,
    });

    // 添加 CORS 头
    const corsHeaders = new Headers(response.headers);
    corsHeaders.set('Access-Control-Allow-Origin', '*');
    corsHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    corsHeaders.set('Access-Control-Allow-Headers', 'Content-Type, X-CMC_PRO_API_KEY');

    return new Response(response.body, {
      status: response.status,
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Proxy error',
      message: error.message
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};
