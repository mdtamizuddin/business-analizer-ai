export interface NormalizedUrl {
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  full: string;
}

export function normalizeUrl(input: string): NormalizedUrl {
  let url = input.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  const parsed = new URL(url);
  return {
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    port: parsed.port,
    pathname: parsed.pathname,
    search: parsed.search,
    full: parsed.href,
  };
}

export function isInternalLink(link: string, baseUrl: string): boolean {
  try {
    const linkUrl = new URL(link, baseUrl);
    const baseUrlObj = new URL(baseUrl);
    return linkUrl.hostname === baseUrlObj.hostname;
  } catch {
    return false;
  }
}

export function deduplicateUrls(urls: string[]): string[] {
  return [...new Set(urls)];
}
