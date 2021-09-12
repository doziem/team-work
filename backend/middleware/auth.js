const config = require('config')
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, config.get('jwtSecret'));
        req.user = decodedToken;
        next();
    } catch {
        res.status(401).json({
            error: new Error('Invalid request!')
        });
    }
}

module.exports = auth
