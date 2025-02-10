export const onRequest = async (context) => {
    const { request } = context;
    const url = new URL(request.url);
    url.hostname = url.hostname.replace(/-test\./, ".");
    const newRequest = new Request(url, request);
    console.log(`call :${newRequest.url.hostname}`)
    const response = fetch(newRequest);
    return response;
  };
  