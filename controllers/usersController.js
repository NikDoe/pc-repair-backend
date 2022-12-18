const User = require('../models/User');
const Note = require('../models/Note');
const bcrypt = require('bcrypt');

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = async (req, res) => {
	const users = await User.find().select('-password').lean();

	if (!users?.length) {
		return res.status(400).json({ message: 'Список пользователей пуст' });
	}

	res.json(users);
};

// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = async (req, res) => {
	const { username, password, roles } = req.body;

	if (!username || !password) {
		return res.status(400).json({ message: 'Пожалуйста, заполните все поля' });
	}

	const duplicate = await User.findOne({ username })
		.collation({ locale: 'en', strength: 2 })
		.lean()
		.exec();

	if (duplicate) {
		return res.status(409).json({ message: 'Пользователь с таким username уже существует' });
	}

	const hashedPwd = await bcrypt.hash(password, 10);

	const userObject =
		!Array.isArray(roles) || !roles.length
			? { username, password: hashedPwd }
			: { username, password: hashedPwd, roles };

	const user = await User.create(userObject);

	if (user) {
		res.status(201).json({ message: `Пользователь ${username} успешно создан` });
	} else {
		res.status(400).json({ message: 'Получены неверные пользовательские данные' });
	}
};

// @desc Update a user
// @route PATCH /users
// @access Private
const updateUser = async (req, res) => {
	const { id, username, roles, active, password } = req.body;

	if (!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean') {
		return res
			.status(400)
			.json({ message: 'Все поля, кроме пароля, обязательны для заполнения' });
	}

	const user = await User.findById(id).exec();

	if (!user) {
		return res.status(400).json({ message: 'Пользователь не найден' });
	}

	const duplicate = await User.findOne({ username })
		.collation({ locale: 'en', strength: 2 })
		.lean()
		.exec();

	// Allow updates to the original user
	if (duplicate && duplicate?._id.toString() !== id) {
		return res.status(409).json({ message: 'Пользователь с таким username уже существует' });
	}

	user.username = username;
	user.roles = roles;
	user.active = active;

	if (password) {
		user.password = await bcrypt.hash(password, 10);
	}

	const updatedUser = await user.save();

	res.json({ message: `Пользователь ${updatedUser.username} изменён` });
};

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = async (req, res) => {
	const { id } = req.body;

	if (!id) {
		return res.status(400).json({ message: 'ID пользователя обязателен' });
	}

	const note = await Note.findOne({ user: id }).lean().exec();
	if (note) {
		return res
			.status(400)
			.json({ message: 'Нельзя удалить пользователя с одной или более заметками' });
	}

	const user = await User.findById(id).exec();

	if (!user) {
		return res.status(400).json({ message: 'Пользователь не найден' });
	}

	const result = await user.deleteOne();

	const reply = `Пользователь ${result.username} с ID ${result._id} был успешно удалён`;
	res.json(reply);
};

module.exports = {
	getAllUsers,
	createNewUser,
	updateUser,
	deleteUser,
};
