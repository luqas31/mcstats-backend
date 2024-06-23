import mysql2 from 'mysql2';

const db = mysql2.createConnection({
	host: "localhost",
	user: "root",
	password: "",
	database: "users",
	port: "3306",
});

db.connect(error => {
	if (error) {
		console.error('Error connecting to MySQL:', error);
	} else {
		console.log('Connected to MySQL!');
	}
});

export default db;
