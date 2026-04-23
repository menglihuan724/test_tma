/**
 * OKX API 代理中间件
 * 路径格式: /okx/api/v5/wallet/xxx
 */
export const onRequest = async ({ request, env }) => {
  const url = new URL(request.url);

  // 转换路径: /okx/api/v5/wallet/xxx -> /api/v5/wallet/xxx
  const okxPath = url.pathname.replace(/^\/okx/, '');
  const targetUrl = `https://www.okx.com${okxPath}${url.search}`;

  // 保留原始请求头（包括 OKX 签名 headers）
  const headers = new Headers(request.headers);
  headers.delete('Host');
  headers.delete('cf-connecting-ip');

  console.log(`[OKX] ${request.method} ${url.pathname}${url.search} → ${targetUrl}`);
  console.log(`[OKX] Headers: OK-ACCESS-KEY=${headers.get('OK-ACCESS-KEY')}, OK-ACCESS-PROJECT=${headers.get('OK-ACCESS-PROJECT')}`);

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: ['POST', 'PUT', 'PATCH'].includes(request.method)
        ? await request.text()
        : undefined,
    });

    console.log(`[OKX] Response status: ${response.status}`);

    // 添加 CORS 头
    const corsHeaders = new Headers(response.headers);
    corsHeaders.set('Access-Control-Allow-Origin', '*');
    corsHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    corsHeaders.set('Access-Control-Allow-Headers',
      'Content-Type, Authorization, OK-ACCESS-KEY, OK-ACCESS-SIGN, OK-ACCESS-TIMESTAMP, OK-ACCESS-PASSPHRASE, OK-ACCESS-PROJECT');

    return new Response(response.body, {
      status: response.status,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error(`[OKX] Error: ${error.message}`);
    return new Response(JSON.stringify({
      error: 'Proxy error',
      message: error.message
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};
