import JWT from 'jsonwebtoken';

export const verifyJWT = (req, res, next) => {
	const token = req.headers['x-access-token'];

	if (!token) {
		res.status(401).send('We need a token, please give it to us next time!');
	} else {
		JWT.verify(token, 'jwtSecret', (error, decoded) => {
			if (error) {
				res.status(401).json({ auth: false, message: 'Failed to authenticate token' });
			} else {
				req.userId = decoded.id;
				next();
			}
		});
	}
};












