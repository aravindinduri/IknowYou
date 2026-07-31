import * as cheerio from 'cheerio';
import { logger } from '../logger.js';

export async function fetchAndParseUrl(url) {
  logger.info({ url }, 'Fetching web page content');

  let rawHtml = '';
  let fetchedViaJina = false;

  // Try direct fetch first with realistic browser headers
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      rawHtml = await response.text();
    } else {
      logger.warn({ url, status: response.status }, 'Direct fetch failed/blocked, trying web reader fallback');
    }
  } catch (err) {
    logger.warn({ url, error: err.message }, 'Direct fetch error, trying web reader fallback');
  }

  // Secondary Fallback: Use Jina AI Reader (r.jina.ai) if direct fetch was blocked (e.g. Medium 403)
  if (!rawHtml) {
    try {
      const jinaUrl = `https://r.jina.ai/${url}`;
      logger.info({ jinaUrl }, 'Attempting web reader fetch via r.jina.ai');
      const jinaRes = await fetch(jinaUrl, {
        signal: AbortSignal.timeout(8000),
        headers: {
          'Accept': 'text/plain',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AIKnowledgeInbox/1.0'
        }
      });

      if (jinaRes.ok) {
        const text = await jinaRes.text();
        if (text && text.length > 50) {
          fetchedViaJina = true;
          // Extract title from first markdown header if present
          let title = new URL(url).hostname;
          const match = text.match(/^Title:\s*(.+)$/m) || text.match(/^#\s+(.+)$/m);
          if (match && match[1]) {
            title = match[1].trim();
          }

          logger.info({ url, title, textLength: text.length }, 'URL page parsed successfully via Jina Web Reader');
          return {
            title,
            content: text.trim(),
            url
          };
        }
      }
    } catch (err) {
      logger.warn({ error: err.message }, 'Jina reader fallback failed');
    }
  }

  // Parse direct HTML if available
  if (rawHtml) {
    try {
      const $ = cheerio.load(rawHtml);
      $('script, style, svg, nav, footer, header, iframe, noscript, [role="navigation"], [role="banner"]').remove();

      let title = $('title').text().trim() || 
                  $('meta[property="og:title"]').attr('content') || 
                  $('h1').first().text().trim() || 
                  new URL(url).hostname;

      title = title.replace(/\s+/g, ' ');

      let mainText = $('article, main, #content, .content, .post-content').text();
      if (!mainText || mainText.trim().length < 200) {
        mainText = $('body').text();
      }

      const cleanText = mainText
        .replace(/\r\n|\r/g, '\n')
        .replace(/\n\s*\n/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .trim();

      if (cleanText && cleanText.length >= 20) {
        logger.info({ url, title, textLength: cleanText.length }, 'URL page parsed successfully');
        return {
          title,
          content: cleanText,
          url
        };
      }
    } catch (err) {
      logger.error({ error: err.message }, 'Cheerio DOM parsing error');
    }
  }

  // If all attempts failed, throw a user-friendly 400 error
  const userErr = new Error(`Failed to scrape URL (Target website blocked automated access). Try copying the text into a Note.`);
  userErr.statusCode = 400;
  throw userErr;
}
