export const onRequest = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  url.hostname = url.hostname.replace("-test", "");
  const newRequest = new Request(url, request);
  console.log(newRequest)
  const response = fetch(newRequest);
  // const response = await context.next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
};
