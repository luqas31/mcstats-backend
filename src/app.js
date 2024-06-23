import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import bodyParserMiddleware from './middleware/bodyParserMiddleware.js';
import router from './routes/index.js';


const app = express();

app.use(express.json());
app.use(
	cors({
		origin: 'http://localhost:5173',
		methods: ['GET', 'POST'],
		credentials: true,
	}),
);
app.use(cookieParser());
app.use(bodyParserMiddleware);
app.use(
	session({
		key: 'userId',
		secret: 'maluquicemesmo',
		resave: false,
		saveUninitialized: false,
		cookie: {
			expires: 60 * 60 * 24,
		},
	}),
);

app.use('/', router);

const PORT = 3333;
app.listen(PORT, () => {
	console.log(`Express Server Running on Port ${PORT}`);
});
