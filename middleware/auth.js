/**
 * Authentication Middleware
 * Checks if the user has an active session (cookie verified by express-session)
 */
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'Authentication required. Please sign in.' });
  }
  next();
};

module.exports = { requireAuth };

