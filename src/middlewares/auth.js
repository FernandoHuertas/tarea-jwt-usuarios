import { verifyToken } from '../lib/jwt.js';
import { HttpError } from '../utils/http-error.js';

// Exige Authorization: Bearer <token> válido. Si todo está bien deja req.user = { id, email }.
export function requireAuth(req, _res, next) {
  const [scheme, token] = (req.get('authorization') ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw HttpError.unauthorized('Falta el header Authorization: Bearer <token>');
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email };
  } catch {
    throw HttpError.unauthorized('Token inválido o expirado');
  }
  next();
}
