import express from 'express';
import mysql2 from 'mysql2';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcrypt';

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
					res.send(results);
				} else {
					res.send({ message: 'Wrong email/password combination!' });
				}
			});
		}
	});
});

const PORT = 3333;
app.listen(PORT, () => {
	console.log(`Servidor Express rodando na porta ${PORT}`);
});
