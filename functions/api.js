export const onRequest = async (context) => {
  const { request } = context;
  const url = new URL("https://www.baidu.com");
//   url.hostname ="faku.cflpool.io"
  const newRequest = new Request(url, request);
  console.log(newRequest)
  const response = fetch(newRequest);
  // const response = await context.next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
};
