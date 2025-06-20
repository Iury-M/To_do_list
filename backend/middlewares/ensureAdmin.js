function ensureAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Acesso negado. Apenas admins.' });
}

module.exports = { ensureAdmin };
