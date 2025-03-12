import chalk from 'chalk';

export class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  public info(message: string, ...args: any[]): void {
    console.log(
      chalk.blue(`[INFO] ${this.getTimestamp()}`),
      chalk.white(message),
      ...args
    );
  }

  public error(message: string, ...args: any[]): void {
    console.error(
      chalk.red(`[ERROR] ${this.getTimestamp()}`),
      chalk.white(message),
      ...args
    );
  }

  public warn(message: string, ...args: any[]): void {
    console.warn(
      chalk.yellow(`[WARN] ${this.getTimestamp()}`),
      chalk.white(message),
      ...args
    );
  }

  public debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(
        chalk.gray(`[DEBUG] ${this.getTimestamp()}`),
        chalk.white(message),
        ...args
      );
    }
  }
} 