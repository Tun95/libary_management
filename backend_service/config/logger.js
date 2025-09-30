const { Logtail } = require("@logtail/node");
const pino = require("pino");
const config = require("./index");

const pinoLogger = pino({
  level: config.env === "development" ? "debug" : "info",
  timestamp: pino.stdTimeFunctions.isoTime,
});

const logtail = new Logtail(config.logtail.apikey, {
  endpoint: config.logtail.endpoint,
});

const createLogEntry = (level, message, context = {}, error = null) => ({
  level,
  message: typeof message === "string" ? message : "An error occured",
  timestamp: new Date().toISOString(),
  ...(error && {
    stack: error.stack,
    name: error.name,
  }),
  ...context,
});

const error = async (error, context = {}) => {
  try {
    const errorLog = createLogEntry("error", error.message, context, error);

    pinoLogger.error(errorLog);

    if (config.env !== "development") {
      await logtail.error(errorLog.message, errorLog);
    }

    return errorLog;
  } catch (loggingError) {
    pinoLogger.error("Logging system failure:", loggingError);
    return null;
  }
};

const warn = async (message, context = {}) => {
  try {
    const warnLog = createLogEntry("warn", message, context);

    pinoLogger.warn(warnLog);

    if (config.env !== "development") {
      await logtail.warn(warnLog.message, warnLog);
    }

    return warnLog;
  } catch (loggingError) {
    pinoLogger.error("Logging system failure:", loggingError);
    return null;
  }
};

const info = async (message, context = {}) => {
  try {
    const infoLog = createLogEntry("info", message, context);

    pinoLogger.info(infoLog);

    if (config.env !== "development") {
      await logtail.info(infoLog.message, infoLog);
    }

    return infoLog;
  } catch (loggingError) {
    pinoLogger.error("Logging system failure:", loggingError);
    return null;
  }
};

module.exports = {
  error,
  info,
  warn,
  pinoLogger,
  logtail,
};
