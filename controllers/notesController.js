const Note = require('../models/Note');
const User = require('../models/User');

// @desc Get all notes
// @route GET /notes
// @access Private
const getAllNotes = async (req, res) => {
	const notes = await Note.find().lean();

	if (!notes?.length) {
		return res.status(400).json({ message: 'Список заметок пуст' });
	}

	const notesWithUser = await Promise.all(
		notes.map(async note => {
			const user = await User.findById(note.user).lean().exec();
			return { ...note, username: user.username };
		}),
	);

	res.json(notesWithUser);
};

// @desc Create new note
// @route POST /notes
// @access Private
const createNewNote = async (req, res) => {
	const { user, title, text } = req.body;

	if (!user || !title || !text) {
		return res.status(400).json({ message: 'Пожалуйста, заполните все поля' });
	}

	const duplicate = await Note.findOne({ title })
		.collation({ locale: 'en', strength: 2 })
		.lean()
		.exec();

	if (duplicate) {
		return res.status(409).json({ message: 'Заметка с таким заголовком уже существует' });
	}

	const noteObject = { user, title, text };

	const note = await Note.create(noteObject);

	if (note) {
		res.status(201).json({ message: `Заметка успешно создана` });
	} else {
		res.status(400).json({ message: 'Получены неверные данные' });
	}
};

// @desc Update a note
// @route PATCH /notes
// @access Private
const updateNote = async (req, res) => {
	const { id, user, title, text, completed } = req.body;

	if (!id || !user || !title || !text || typeof completed !== 'boolean') {
		return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
	}

	const note = await Note.findById(id).exec();

	if (!note) {
		return res.status(400).json({ message: 'Заметка не найдена' });
	}

	const duplicate = await Note.findOne({ title })
		.collation({ locale: 'en', strength: 2 })
		.lean()
		.exec();

	if (duplicate && duplicate?._id.toString() !== id) {
		return res.status(409).json({ message: 'Заметка с таким заголовком уже существует' });
	}

	note.user = user;
	note.title = title;
	note.text = text;
	note.completed = completed;

	const updatedNote = await note.save();

	res.json(`Заметка ${updatedNote.title} обновлена`);
};

// @desc Delete a note
// @route DELETE /notes
// @access Private
const deleteNote = async (req, res) => {
	const { id } = req.body;

	if (!id) {
		return res.status(400).json({ message: 'ID заметки обязателен' });
	}

	const note = await Note.findById(id).exec();

	if (!note) {
		return res.status(400).json({ message: 'Заметка не найдена' });
	}

	const result = await note.deleteOne();

	const reply = `Заметка '${result.title}' с ID ${result._id} успешно удалена`;

	res.json(reply);
};

module.exports = { getAllNotes, createNewNote, updateNote, deleteNote };
