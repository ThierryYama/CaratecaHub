import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';

const JWT_SECRET: Secret = (process.env.JWT_SECRET as Secret);

export interface AuthRequest extends Request {
  user?: { idAssociacao: number; role: 'associacao' };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ message: 'Token não informado' });

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ message: 'Formato de token inválido' });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = { idAssociacao: Number(payload.sub), role: 'associacao' };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}
