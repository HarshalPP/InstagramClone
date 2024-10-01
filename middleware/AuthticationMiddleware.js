const jwt = require('jsonwebtoken');
const User = require('../models/User');

// isAuthenticated Middleware
exports.isAuthenticated = async (req, res, next) => {
  
  const token = req.headers.authorization;

  // Check if token is provided//

  if (!token) {
    return res.status(400).json({ message: 'Access denied, token missing.' });
  }

  try {
    // Verify the token using JWT //
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the user role is 'Investor'
    if (decoded) {
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      req.user = user;
      next();
    } else {
      return res.status(403).json({ message: 'Access denied, unauthorized role.' });
    }
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please login again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    // General error handling
    return res.status(500).json({ message: 'An error occurred.', error: error.message });
  }
};



// Check the Role of the Users //

exports.isAuthorized = (...requiredRoles)=>{
    return (req,res,next)=>{
      // check if User is Authicated
      if(!requiredRoles.includes(req.user.role)){
        return res.status(403).json({ message: 'Access denied, insufficient permissions.' });
      }
          // If authorized, continue to the next middleware
          next();

    }
}