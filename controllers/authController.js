const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// @desc Login
// @route POST /auth
// @access Public
const login = async (req, res) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
	}

	const foundUser = await User.findOne({ username }).exec();

	if (!foundUser || !foundUser.active) {
		return res.status(401).json({ message: 'пользователя с таким username не существует' });
	}

	const match = await bcrypt.compare(password, foundUser.password);

	if (!match) return res.status(401).json({ message: 'неверный пароль' });

	const accessToken = jwt.sign(
		{
			UserInfo: {
				username: foundUser.username,
				roles: foundUser.roles,
			},
		},
		process.env.ACCESS_TOKEN_SECRET,
		{ expiresIn: '15m' },
	);

	const refreshToken = jwt.sign(
		{ username: foundUser.username },
		process.env.REFRESH_TOKEN_SECRET,
		{ expiresIn: '7d' },
	);

	res.cookie('jwt', refreshToken, {
		httpOnly: true,
		secure: true, //https
		sameSite: 'None',
		maxAge: 7 * 24 * 60 * 60 * 1000,
	});

	res.json({ accessToken });
};

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = (req, res) => {
	const cookies = req.cookies;

	if (!cookies?.jwt)
		return res.status(401).json({
			message: 'Вы вышли из системы...',
		});

	const refreshToken = cookies.jwt;

	jwt.verify(
		refreshToken,
		process.env.REFRESH_TOKEN_SECRET,
		async (err, decoded) => {
			if (err)
				return res.status(403).json({ message: 'Срок действия вашего логина истек...' });

			const foundUser = await User.findOne({ username: decoded.username }).exec();

			if (!foundUser) return res.status(401).json({ message: 'пользователь не найден' });

			const accessToken = jwt.sign(
				{
					UserInfo: {
						username: foundUser.username,
						roles: foundUser.roles,
					},
				},
				process.env.ACCESS_TOKEN_SECRET,
				{ expiresIn: '15m' },
			);

			res.json({ accessToken });
		},
	);
};

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {
	const cookies = req.cookies;
	if (!cookies?.jwt) return res.sendStatus(204);
	res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
	res.json({ message: 'Cookie очищены' });
};

module.exports = {
	login,
	refresh,
	logout,
};
