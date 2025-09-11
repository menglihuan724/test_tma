export const onRequest = async (context) => {
  const { request } = context;
  // console.log(`request:${request.url}`);  
  const url = new URL(request.url);
  const faku_url = await context.env.faku_h5.get("public_url");
  const baseUrl = new URL("https://api.faku.info");

  url.hostname = baseUrl.hostname;
  url.protocol = baseUrl.protocol;
  url.port = baseUrl.port;
  // console.log(request.headers)
  const new_headers = new Headers(request.headers);
  new_headers.delete("cf-connecting-ip") 
  
  const newRequest = new Request(url.toString(), {
    method: request.method,
    headers: new_headers,
    body: request.body,
  });
  // console.log(`call :${newRequest.url.hostname}`)
  const response = await fetch(newRequest);
  return response;
};
