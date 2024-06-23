import bcrypt from 'bcrypt';
import JWT from 'jsonwebtoken';
import db from '../config/db.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

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

const transporter = nodemailer.createTransport({
	service: 'gmail, outlook, or other email service provider',
	auth: {
		user: 'theemailyouwanttosendtheresetlink@outlook.com',
		pass: 'theaccountspassword',
	},
});

export const requestPasswordReset = (req, res) => {
	const { email } = req.body;

	const checkEmailQuery = 'SELECT * FROM users WHERE email = ?;';
	db.query(checkEmailQuery, [email], (error, results) => {
		if (error) {
			console.error('Error executing the SQL query:', error);

			res.status(500).json({ message: 'Error requesting password reset!' });
			return;
		}

		if (results.length === 0) {
			res.status(404).json({ message: 'Email not found!' });
			return;
		}

		const user = results[0];
		const token = crypto.randomBytes(20).toString('hex');

		const expiresAt = new Date();
		expiresAt.setHours(expiresAt.getHours() + 1);

		const insertTokenQuery = 'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?);';
		db.query(insertTokenQuery, [user.id, token, expiresAt], (error, results) => {
			if (error) {
				console.error('Error saving password reset token:', error);
				res.status(500).send('Error requesting password reset!');
				return;
			}

			const resetLink = `http://localhost:5173/#/reset-password?token=${token}`;
			const mailOptions = {
				from: 'theemailyouwanttosendtheresetlink@outlook.com',
				to: email,
				subject: 'Password Reset Request',
				text: `You are receiving this email because you (or someone else) has requested the reset of the password for your account.\n\n
                        Please click on the following link, or paste this into your browser to complete the process:\n\n
                        ${resetLink}\n\n
                        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
			};

			transporter.sendMail(mailOptions, (error, info) => {
				if (error) {
					console.error('Error sending email:', error);
					res.status(500).json({ message: 'Error sending password reset email!' });
				} else {
					console.log('Email sent: ' + info.response);
					res.status(200).json({ message: 'Password reset email sent!' });
				}
			});
		});
	});
};

export const resetPassword = (req, res) => {
	const { token, newPassword } = req.body;

	console.log('Received token:', token);

	const checkTokenQuery = 'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW();';
	db.query(checkTokenQuery, [token], (error, results) => {
		if (error) {
			console.error('Error executing the SQL query:', error);
			res.status(500).send('Error resetting password!');
			return;
		}

		if (results.length === 0) {
			console.log('Invalid or expired token');
			res.status(400).send('Invalid or expired token!');
			return;
		}

		const tokenInfo = results[0];
		const hashedPassword = bcrypt.hashSync(newPassword, saltRounds);

		const updatePasswordQuery = 'UPDATE users SET password = ? WHERE id = ?;';
		db.query(updatePasswordQuery, [hashedPassword, tokenInfo.user_id], (error, results) => {
			if (error) {
				console.error('Error executing the SQL query:', error);
				res.status(500).send('Error resetting password!');
			} else {
				const deleteTokenQuery = 'DELETE FROM password_reset_tokens WHERE id = ?;';
				db.query(deleteTokenQuery, [tokenInfo.id], (error, results) => {
					if (error) {
						console.error('Error deleting reset token:', error);
					}
				});

				res.status(200).send('Password reset successfully!');
			}
		});
	});
};
