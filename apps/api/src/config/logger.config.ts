/**
 * log levels -
 * `trace`
 * `debug`
 * `info`
 * `warn`
 * `error`
 * `fatal`
 */

export const envToLogger = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
  production: {
    level: "info",
    redact: ["req.headers.authorization", "req.headers.cookie", "req.headers['x-api-key']"],
  },
  test: false,
};
