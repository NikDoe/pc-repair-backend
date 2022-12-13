const rateLimit = require('express-rate-limit');
const { logEvents } = require('./logger');

const loginLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 5,
	message: {
		message:
			'Слишком много попыток входа с этого IP, пожалуйста, повторите попытку после 60-секундной паузы',
	},
	handler: (req, res, next, options) => {
		logEvents(
			`Слишком много запросов: ${options.message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
			'errLog.log',
		);
		res.status(options.statusCode).send(options.message);
	},
	standardHeaders: true,
	legacyHeaders: false,
});

module.exports = loginLimiter;
