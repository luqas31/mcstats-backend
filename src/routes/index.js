import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';
import { verifyJWT } from '../middleware/authMiddleware.js';
import { getPlayerStats, getPlayerRanking } from '../controllers/playerController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/auth', verifyJWT);
router.get('/login', (req, res) => {
	if (req.session.user) {
		res.send({ loggedIn: true, user: req.session.user });
	} else {
		res.send({ loggedIn: false });
	}
});
router.get('/player-stats', getPlayerStats);
router.get('/player-ranking', getPlayerRanking);

export default router;
