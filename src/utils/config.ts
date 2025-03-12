import * as dotenv from 'dotenv';
import * as path from 'path';

export class Config {
  private static instance: Config;
  private config: Record<string, any> = {};

  private constructor() {
    this.loadEnv();
  }

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  private loadEnv(): void {
    const envPath = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
    const result = dotenv.config({
      path: path.resolve(process.cwd(), envPath),
    });

    if (result.error) {
      console.warn(`Warning: ${envPath} file not found`);
    }

    this.config = {
      ...process.env,
      ...result.parsed,
    };
  }

  get<T = string>(key: string, defaultValue?: T): T {
    const value = this.config[key];
    
    if (value === undefined) {
      if (defaultValue === undefined) {
        throw new Error(`Configuration key "${key}" not found`);
      }
      return defaultValue;
    }

    // Intentar convertir el valor al tipo esperado
    if (typeof defaultValue === 'number') {
      return Number(value) as unknown as T;
    }
    if (typeof defaultValue === 'boolean') {
      return (value.toLowerCase() === 'true') as unknown as T;
    }
    if (Array.isArray(defaultValue)) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return value.split(',') as unknown as T;
      }
    }
    if (typeof defaultValue === 'object') {
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    }

    return value as unknown as T;
  }

  set(key: string, value: any): void {
    this.config[key] = value;
  }

  has(key: string): boolean {
    return key in this.config;
  }

  getAll(): Record<string, any> {
    return { ...this.config };
  }

  static get<T = string>(key: string, defaultValue?: T): T {
    return Config.getInstance().get(key, defaultValue);
  }

  static set(key: string, value: any): void {
    Config.getInstance().set(key, value);
  }

  static has(key: string): boolean {
    return Config.getInstance().has(key);
  }

  static getAll(): Record<string, any> {
    return Config.getInstance().getAll();
  }
} 