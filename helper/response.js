function success(status_code, message, data = []) {
	if (!Array.isArray(data)) {
		data = [data];
	}
	return { status: true, status_code: status_code.toString(), message: message, data: data };
}

function error(status_code, message, data = []) {
	if (!Array.isArray(data)) {
		data = [data];
	}
	return { status: false, status_code: status_code.toString(), message: message, data: data };
}

module.exports = {
    success,
    error
};