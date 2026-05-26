import jwt from 'jsonwebtoken';

const SECRET = process.env.APP_JWT_SECRET ?? 'dev-secret';

export function signToken(payload: Record<string, unknown>, opts?: jwt.SignOptions) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d', ...(opts ?? {}) });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET) as Record<string, unknown>;
  } catch {
    return null;
  }
}
