import express from 'express';
import mysql2 from 'mysql2';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcrypt';
import JWT from 'jsonwebtoken';

const saltRounds = 10;

dotenv.config({ path: './.env' });

const app = express();

app.use(express.json());
app.use(cors());

const db = mysql2.createConnection({
	host: process.env.DATABASE_HOST,
	user: process.env.DATABASE_USER,
	password: process.env.DATABASE_PASSWORD,
	database: process.env.DATABASE,
	port: process.env.DATABASE_PORT,
});

db.connect(error => {
	if (error) {
		console.log('Error connecting to MySQL', error);
	} else {
		console.log('Conected to MySQL!');
	}
});

app.post('/register', (req, res) => {
	const email = req.body.email;
	const password = req.body.password;

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
});

const verifyJWT = (req, res, next) => {
	const token = req.headers['x-access-token'];

	if (!token) {
		res.send('We need a token, please give it to us next time!');
	} else {
		JWT.verify(token, 'jwtSecret', (error, decoded) => {
			if (error) {
				res.json({ auth: false, message: 'You failed to authenticate' });
			} else {
				req.userId = decoded.id;
				next();
			}
		});
	}
};

app.get('/auth', verifyJWT, (req, res) => {
	res.send('You are authenticated');
});

app.post('/login', (req, res) => {
	const email = req.body.email;
	const password = req.body.password;

	const query = 'SELECT * FROM users WHERE email = ?;';

	db.query(query, [email], (error, results) => {
		if (error) {
			res.send({ error: error });
		}

		if (results.length > 0) {
			bcrypt.compare(password, results[0].password, (error, response) => {
				if (response) {
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
});

app.get('/player-stats', (req, res) => {
	const nick = req.query.nick;

	const query = 'SELECT kills, deaths FROM projetolucas.stats WHERE nick =?;';

	db.query(query, [nick], (error, results) => {
		if (error) {
			console.error('Error executing the SQL query:', error);
			res.status(500).send('Error fetching player stats!');
			return;
		}

		if (results.length > 0) {
			res.send(results[0]);
		} else {
			res.status(404).send('Player not found!');
		}
	});
});

const PORT = 3333;
app.listen(PORT, () => {
	console.log(`Servidor Express rodando na porta ${PORT}`);
});
