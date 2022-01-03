const jwt = require("jsonwebtoken");
const User = require("../models/User");
const response = require("../helper/response");
const {errorLog} = require("../helper/consoleLog");

const auth = async (req, res, next) => {
	try {
		// bearer token
		const bearerHeader = req.headers['authorization'];
		if (typeof bearerHeader !== 'undefined' && bearerHeader.startsWith('Bearer ')) {
			const token = bearerHeader.substring(7, bearerHeader.length);
			const verifyUser = jwt.verify(token, process.env.SECRET_KEY);

			let user = await User.findOne({_id: verifyUser._id, status: 1}).lean();
			// if (!user) {
			// 	return res.send(response.error(401, 'User is Inactive', [] ));
			// }

			//token compare and check in database
			const tokenExists = user.tokens.some(t => t.token === token);
			if(!tokenExists) return res.send(response.error(401, 'Token is expired', [] ));
   
			var userJSON = JSON.parse(JSON.stringify(user));
			userJSON.token = token;
			req.user = userJSON;
			next();
		} else {
			return res.send(response.error(401, 'Token Not Found', [] ));
		}
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Token is invalid', [] ));
	}
}

module.exports = auth;
