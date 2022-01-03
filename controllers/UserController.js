const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const nodemailer = require('nodemailer');
const { encrypt, decrypt } = require('../../helper/crypto');
const Joi = require("joi");
const response = require("../../helper/response");
const commonHelpers = require("../../helper/commonHelpers");
const {errorLog,consoleLog} = require("../../helper/consoleLog");
const UserResource = require('../resources/UserResource');

exports.registerValidation = async (req, res, next) => {
	const schema = Joi.object({
		email: Joi.string().min(6).required().email(),
		password: Joi.string().min(6).required()
	});
	const validation = schema.validate(req.body, __joiOptions);
	if (validation.error) {
		return res.send(response.error(400, validation.error.details[0].message, [] ));
	} else {
		next();
	}
}

exports.register = async (req, res) => {
	try {
		const existsUser = await User.findOne({ email: req.body.email });
		if(existsUser) {
			return res.send(response.error(400, 'email id already exists', [] ));
		}

		const registerUser = new User({
			email: req.body.email,
			password: req.body.password
		});
		const registeredData = await registerUser.save();

		const token = await registerUser.generatingAuthToken(); // generate token
		const userDataJson = JSON.parse(JSON.stringify(registeredData));
		userDataJson.token = token; // added token in user document
		delete userDataJson.password;

		return res.send(response.success(200, 'Registration Success', UserResource(userDataJson)));
	} catch (error) {
		if (error.name == "ValidationError") {
			const errorMessage = error.errors[Object.keys(error.errors)[0]]
			return res.send(response.error(400, errorMessage.message, [] ));
		} else {
			errorLog(__filename, req.originalUrl, error);
			return res.send(response.error(500, 'Something want wrong', [] ));
		}
	}
}

exports.verifyEmailCallback = async (req, res) => {
	try {
		const _id = decrypt(req.params.key, req.params.id);
		const userData = await User.findOne({ _id: _id });
		if (userData) {
			const updateUser = await User.findByIdAndUpdate({_id: _id}, {status: 1}, {new : true} );
			return res.redirect('/verified-email-success');
		} else {
			return res.render('errors/main',{ code: 404, errorMessage: 'Data Not found'})
		}
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', [] ));
	}
}

exports.verifiedEmailSuccess = async (req, res) => {
	return res.render('auth/verifyEmailSuccess');
}

exports.login = async (req, res) => {
	try {
		const email = req.body.email;
		const password = req.body.password;

		let userData = await User.findOne({ email: email }).select("+password");
		if (userData && userData.password) {
			const isMatch = await bcrypt.compare(password, userData.password);
			if (isMatch) {
				const token = await userData.generatingAuthToken(); // generate token
				userData = JSON.parse(JSON.stringify(userData));
				userData.token = token; // add token in user document
				delete userData['password']; // remove password in user data
				delete userData['question_answer'];
				// userData.profile_per = commonHelpers.userProfilePer(userData);

				return res.send(response.success(200, 'Login Success', UserResource(userData) ));
			} else {
				return res.send(response.error(400, 'Login Failed. Incorrect email or password', [] ));
			}
		} else {
			return res.send(response.error(400, 'Login Failed. Incorrect email or password', [] ));
		}
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', [] ));
	}
}

exports.forgotPassword = async (req, res) => {
	try {
		const email = req.body.email;
		const userData = await User.findOne({ email: email });

		if (userData) {
			// send mail for resting password	
			const transporter = nodemailer.createTransport({
				host: process.env.MAIL_HOST,
				port: process.env.MAIL_PORT,
				secure: false,
				requireTLS: true,
				auth: {
					user: process.env.MAIL_USERNAME,
					pass: process.env.MAIL_PASSWORD
				}
			});
			const encryptedId = encrypt(""+userData._id+"");
			const emailVerifyUrl = req.protocol + '://' + req.get('host') + '/reset-password/'+ encryptedId.key + '/' + encryptedId.id;
			consoleLog(__filename, req.originalUrl, emailVerifyUrl);

			const mailOptions = {
				from: process.env.MAIL_FROM_ADDRESS,
				to: userData.email,
				subject: 'Reset Your Password',
				text: '<html><body><a href="'+ emailVerifyUrl +'"><button>Reset Password</button></a></body></html>'
			};
			transporter.sendMail(mailOptions, function (error, info) {
				if (error) {
					return console.log('Email sent error: ' + error);
				} else {
					return console.log('Email sent: ' + info.response);
				}
				transporter.close();
			});
			await User.findByIdAndUpdate(userData._id, {reset_password_status: 1}, {new : true, runValidators: true} );
			return res.send(response.success(200, 'Email Send Successfully', [] ));
		} else {
			return res.send(response.error(400, 'Email not found', [] ));
		}
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', [] ));
	}
}
exports.resetPasswordWeb = async (req, res) => {
	const _id = decrypt(req.params.key, req.params.id);
	const userData = await User.findOne({ _id: _id });
	if (userData && userData.reset_password_status == 1) {
		return res.render('auth/resetPassword', { key: req.params.key, id: req.params.id });
	} else {
		return res.render('errors/main',{ code: 400, errorMessage: 'Data Not found'});
	}
}

exports.resetPassword = async (req, res) => {
	try {
		if (req.body.password !== req.body.confirm_password) {
			return res.render('auth/resetPassword', { key: req.params.key, id: req.params.id, error: "password are not match" })
		}
		const _id = decrypt(req.params.key, req.params.id);
		const userData = await User.findOne({ _id: _id });
		if (userData && userData.reset_password_status == 1) {
			await User.findByIdAndUpdate(_id, {password: req.body.password, reset_password_status: 0}, {new : true, runValidators: true} );
			return res.redirect('/reset-password-success');
		} else {
			return res.render('errors/main',{ code: 404, errorMessage: 'Data Not found'})
		}
	} catch (error) {
		if (error.name == "ValidationError") {
			const errorMessage = error.errors[Object.keys(error.errors)[0]];
			return res.render('auth/resetPassword', { key: req.params.key, id: req.params.id, error: errorMessage.message })
		} else {
			errorLog(__filename, req.originalUrl, error);
			return res.render('errors/main',{ code: 500, errorMessage: 'Something want wrong. Please try again.'})
		}
	}
}

exports.resetPasswordSuccess = async (req, res) => {
	return res.render('auth/resetPasswordSuccess');
}