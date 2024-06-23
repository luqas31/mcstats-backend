import bcrypt from 'bcrypt';
import JWT from 'jsonwebtoken';
import db from '../config/db.js';

const saltRounds = 10;

export const registerUser = (req, res) => {
	const { email, password } = req.body;

	const checkEmailQuery = 'SELECT * FROM users WHERE email = ?;';
	db.query(checkEmailQuery, [email], (error, results) => {
		if (error) {
			console.error('Error executing the SQL query:', error);
			res.status(500).send('Error signing up user!');
			return;
		}

		if (results.length > 0) {
			res.status(400).send('Email already in use!');
			return;
		}

		bcrypt.hash(password, saltRounds, (error, hash) => {
			if (error) {
				console.log('Error hashing the password:', error);
				res.status(500).send('Error hashing password!');
				return;
			}

			const insertQuery = 'INSERT INTO users (email, password) VALUES (?, ?)';
			db.query(insertQuery, [email, hash], (error, results) => {
				if (error) {
					console.error('Error executing the SQL query:', error);
					res.status(500).send('Error signing up user!');
					return;
				}
				res.status(200).send('User registered successfully!');
			});
		});
	});
};

export const loginUser = (req, res) => {
	const { email, password } = req.body;

	const query = 'SELECT * FROM users WHERE email = ?;';

	db.query(query, [email], (error, results) => {
		if (error) {
			res.send({ error: error });
			return;
		}

		if (results.length > 0) {
			bcrypt.compare(password, results[0].password, (error, response) => {
				if (response) {
					req.session.user = results;
					const id = results[0].id;
					const token = JWT.sign({ id }, 'jwtSecret', {
						expiresIn: 300,
					});

					res.json({ auth: true, token: token, results: results });
				} else {
					res.status(401).send({ message: 'Wrong email/password combination!' });
				}
			});
		} else {
			res.json({ auth: false, message: 'User does not exist!' });
		}
	});
};
