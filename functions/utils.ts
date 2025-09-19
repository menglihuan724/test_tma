export function urlParams(url: string) {
    const querystring = url.split('?')[1];
    if (!querystring) {
        return {};
    }
    const params = querystring.split('&');
    const result: Record<string, string> = {};
    for (let i = 0; i < params.length; i++) {
        const pair = params[i].split('=');
        result[pair[0]] = pair[1];
    }
    return result;
}