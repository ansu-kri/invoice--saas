const User = require('../Model/user');
const jwt = require('jsonwebtoken');


const authMiddleware = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    console.log('Auth Header:', authHeader);  // Debug log

    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header is missing' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token:', token);  // Debug log

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded Token:', decoded);  // Debug log

        // Fetch the employee from the database using the decoded token's employeeID
        const employee = await User.findOne({ employeeID: decoded.employeeID });
        if (!employee) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Check if the current token matches the one stored in the database (single-session logic)
        if (employee.currentToken && employee.currentToken !== token) {
            console.log(`Invalidating previous session for employeeID: ${decoded.employeeID}`);
            return res.status(401).json({ message: 'Session expired, please log in again' });
        }

        // Check if the token has expired based on the session expiry time in the database
        if (new Date() > new Date(employee.sessionExpiry)) {
            console.log(`Session expired for employeeID: ${decoded.employeeID}`);
            // Clear expired session in the database
            employee.currentToken = null;
            employee.sessionExpiry = null;
            await employee.save();
            return res.status(401).json({ message: 'Session expired, please log in again' });
        }

        // If the token is valid, matches the session data, and hasn't expired, attach the user info to the request
        req.user = decoded;
        next();  // Proceed to the next middleware or route handler
    } catch (error) {
        console.log('Authentication failed:', error);
        res.status(401).json({ message: 'Authentication failed' });
    }
};


// Middleware to check if the user has admin privileges
const adminMiddleware = (req, res, next) => {
    authMiddleware(req, res, () => {
        console.log('User in adminMiddleware:', req.user);  // Debug log
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied. Admins only.' });
        }
    });
};

  module.exports = {
    authMiddleware,
    adminMiddleware
};
