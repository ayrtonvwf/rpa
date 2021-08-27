import { HTTPRequest, Page } from "puppeteer";

const blockRequests = (request: HTTPRequest) => {
  const blockers = [
    (url: URL) => url.hostname.indexOf('hotjar.com') !== -1,
    (url: URL) => url.hostname.indexOf('google-analytics.com') !== -1,
    (url: URL) => url.hostname.indexOf('privally.global') !== -1,
    (url: URL) => url.hostname.indexOf('appdynamics.com') !== -1,
    (url: URL) => url.hostname.indexOf('fontawesome.com') !== -1,
    (url: URL) => url.pathname.endsWith('.png'),
    (url: URL) => url.pathname.endsWith('.jpg'),
    (url: URL) => url.pathname.endsWith('.woff'),
    (url: URL) => url.pathname.endsWith('.woff2'),
    (url: URL) => url.pathname.endsWith('.ttf'),
    // (url: URL) => url.pathname.endsWith('.css'),
  ];

  const isBlocked = blockers.some(blocker =>
    blocker(new URL(request.url()))
  );

  if (isBlocked) {
    request.abort();
  } else {
    request.continue();
  }
}

export const blockThirdParty = async (page: Page) => {
  await page.setRequestInterception(true);
  page.on('request', blockRequests);
}