import { logger } from '../logger.js';

export function requestLogger(req, res, next) {
  const startTime = Date.now();
  const { method, url } = req;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    logger.info({
      method,
      url,
      statusCode,
      durationMs: duration
    }, `${method} ${url} ${statusCode} - ${duration}ms`);
  });

  next();
}
