const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 9006;

app.use('/', express.static(path.join(__dirname, '/public')));

app.use('/', require('./routes/root'));

app.all('*', (req, res) => {
	res.status(404);
	if (req.accepts('html')) {
		res.sendFile(path.join(__dirname, 'views', '404.html'));
	} else if (req.accepts('json')) {
		res.json({ message: 'ничего не найдено' });
	} else {
		res.type('txt').send('ничего не найдено');
	}
});

app.listen(PORT, () => console.log(`сервер запущен на порту ${PORT}`));
