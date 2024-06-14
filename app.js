import express from 'express';
import mysql2 from 'mysql2';
import dotenv from 'dotenv';
import cors from 'cors';

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

	const query = 'INSERT INTO users (email, password) VALUES (?, ?)';
	db.query(query, [email, password], (error, results) => {
		if (error) {
			console.error('Error executing the SQL query:', error);
			res.status(500).send('Error signing up user!');
			return;
		}
		res.status(200).send('User registered successfully!');
	});
});

app.post('/login', (req, res) => {
	const email = req.body.email;
	const password = req.body.password;

	const query = 'SELECT * FROM users WHERE email = ? AND password = ?';

	db.query(query, [email, password], (error, results) => {
		if (error) {
			res.send({ error: error });
		}

		if (results.length > 0) {
			res.send(results);
		} else {
			res.send({ message: 'Wrong email/password combination' });
		}
	});
});

const PORT = 3333;
app.listen(PORT, () => {
	console.log(`Servidor Express rodando na porta ${PORT}`);
});