/**
 * Logger simple pour vitrine-client
 * Wrapper autour de console avec possibilité d'étendre plus tard
 */

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  log(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
       
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
       
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
       
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    // Toujours logger les erreurs, même en production
     
    console.error(`[ERROR] ${message}`, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
       
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();
