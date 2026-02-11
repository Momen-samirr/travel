type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
    };

    this.logs.push(entry);

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === "development") {
      const logMessage = `[${entry.timestamp.toISOString()}] [${level.toUpperCase()}] ${message}`;
      if (context) {
        console.log(logMessage, context);
      } else {
        console.log(logMessage);
      }
      if (error) {
        console.error(error);
      }
    }

    // In production, you might want to send to external logging service
    if (process.env.NODE_ENV === "production" && level === "error") {
      // TODO: Send to external logging service (e.g., Sentry, LogRocket)
    }
  }

  info(message: string, context?: Record<string, any>) {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log("error", message, context, error);
  }

  debug(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV === "development") {
      this.log("debug", message, context);
    }
  }

  getLogs(level?: LogLevel, limit = 100): LogEntry[] {
    let filtered = this.logs;
    if (level) {
      filtered = this.logs.filter((log) => log.level === level);
    }
    return filtered.slice(-limit).reverse(); // Most recent first
  }

  clear() {
    this.logs = [];
  }
}

export const logger = new Logger();

