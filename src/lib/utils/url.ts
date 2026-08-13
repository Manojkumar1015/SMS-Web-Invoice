export function getURL(): string {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    'http://localhost:3000';

  // Make sure to include `https://` when not on localhost
  url = url.includes('http') ? url : `https://${url}`;
  // Make sure to remove trailing slash
  url = url.endsWith('/') ? url.slice(0, -1) : url;

  return url;
}
