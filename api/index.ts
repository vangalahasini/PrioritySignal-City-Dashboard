/**
 * PrioritySignal - Vercel Serverless Function Entry Point
 * 
 * Handles all /api/* requests when deployed on Vercel.
 * Preserves all routes, request methods, and response payloads.
 */

import app from '../src/server/app';
import type { IncomingMessage, ServerResponse } from 'http';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req, res);
}

export { app };
