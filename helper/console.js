const fs = require('fs');
const moment = require('moment');

exports.error = (message, filePath, requestUrl) => { //console.error('test error', __filename, '/')
	fs.appendFile('public/logs/error_logs.txt', `\r\n[${moment().format('Y-MM-DD HH:mm:ss (Z)')}] ['${requestUrl}'] ['${filePath}']\r\n`, function (err) {
		if (err) return console.log(err);
	});
	fs.appendFile('public/logs/error_logs.txt', `=> ${message}\r\n`, function (err) {
		if (err) return console.log(err);
		console.error(message);
	});
}

exports.log = (message) => { //console.log('test log')
	console.log(message);
}

exports.logs = (message, filePath, requestUrl) => { //console.logs(__filename, '/', 'test log')
	fs.appendFile('public/logs/console_logs.txt', `\r\n[${moment().format('Y-MM-DD HH:mm:ss (Z)')}] ['${requestUrl}'] ['${filePath}']\r\n`, function (err) {
		if (err) return console.log(err);
	});
	fs.appendFile('public/logs/console_logs.txt', `=> ${message}\r\n`, function (err) {
		if (err) return console.log(err);
		console.error(message);
	});
}