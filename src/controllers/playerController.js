import db from '../config/db.js';

export const getPlayerStats = (req, res) => {
	const { nick } = req.query;

	const query = 'SELECT kills, deaths FROM projetolucas.stats WHERE nick = ?;';

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
};

export const getPlayerRanking = (req, res) => {
	const query = 'SELECT nick, kills, deaths FROM projetolucas.stats ORDER BY kills DESC LIMIT 3;';

	db.query(query, (error, results) => {
		if (error) {
			console.error('Error executing the SQL query:', error);
			res.status(500).send('Error fetching player ranking!');
			return;
		}

		res.send(results);
	});
};
