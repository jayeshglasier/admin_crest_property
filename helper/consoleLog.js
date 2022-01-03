const fs = require('fs');
const moment = require('moment');

function errorLog(filePath, requestUrl, message){ //errorLog(__filename, '/', 'test error')
	fs.appendFile('public/logs/error_logs.txt', `\r\n[${moment().format('Y-MM-DD HH:mm:ss (Z)')}] ['${requestUrl}'] ['${filePath}']\r\n`, function (err) {
		if (err) return console.log(err);
	});
	fs.appendFile('public/logs/error_logs.txt', `=> ${message}\r\n`, function (err) {
		if (err) return console.log(err);
		console.error(message);
	});
}

function consoleLog(filePath, requestUrl, message){ //consoleLog(__filename, '/', 'test log')
	fs.appendFile('public/logs/console_logs.txt', `\r\n[${moment().format('Y-MM-DD HH:mm:ss (Z)')}] ['${requestUrl}'] ['${filePath}']\r\n`, function (err) {
		if (err) return console.log(err);
	});
	fs.appendFile('public/logs/console_logs.txt', `=> ${message}\r\n`, function (err) {
		if (err) return console.log(err);
		console.error(message);
	});
}

module.exports = {errorLog, consoleLog};