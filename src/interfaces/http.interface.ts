import { IncomingMessage, ServerResponse } from 'http';

export interface Request extends IncomingMessage {
  params: Record<string, string>;
  query: Record<string, string>;
  body: any;
  headers: Record<string, string>;
}

export interface Response extends ServerResponse {
  status(code: number): this;
  json(body: any): void;
  send(body: any): void;
  header(name: string, value: string): this;
}

export type NextFunction = (error?: any) => void; 