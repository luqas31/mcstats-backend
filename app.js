import express from 'express';
import mysql2 from 'mysql2';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcrypt';
import JWT from 'jsonwebtoken';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';

const saltRounds = 10;

dotenv.config({ path: './.env' });

const app = express();

app.use(express.json());
app.use(cors({
	origin: 'http://localhost:5173',
	methods: ['GET', 'POST'],
	credentials: true
}));

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
	key: 'userId',
	secret: 'maluquicemesmo',
	resave: false,
	saveUninitialized: false,
	cookie: {
		expires: 60 * 60 * 24,
	},
}));

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
					req.session.user = results;
					console.log(req.session.user);
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

app.get('/login', (req, res) => { 
	if (req.session.user) {
		res.send({ loggedIn: true, user: req.session.user });
	} else {
		res.send({ loggedIn: false });
	}
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

app.get('/player-ranking', (req, res) => {
	const query = 'SELECT nick, kills, deaths FROM projetolucas.stats ORDER BY kills DESC LIMIT 3;';

	db.query(query, (error, results) => {
		if (error) {
			console.error('Error executing the SQL query:', error);
			res.status(500).send('Error fetching player ranking!');
			return;
		}

		res.send(results);
	});
});

const PORT = 3333;
app.listen(PORT, () => {
	console.log(`Servidor Express rodando na porta ${PORT}`);
});
