const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const nodemailer = require('nodemailer');
const { encrypt, decrypt } = require('../../helper/crypto');
const Joi = require("joi");
const response = require("../../helper/response");
const commonHelpers = require("../../helper/commonHelpers");
const {errorLog,consoleLog} = require("../../helper/consoleLog");
const UserResource = require('../resources/UserResource');

// Register Form Validatation
exports.registerValidation = async (req, res, next) => {
	const schema = Joi.object({
		full_name: Joi.string().min(3).max(150).required(),
		email: Joi.string().min(6).max(100).required().email(),
		mobile_no: Joi.string().min(6).max(12).required(),
		password: Joi.string().min(6).max(30).required(),
		position:Joi.string().min(1).required(),
	});
	console.log(req.body);
	const validation = schema.validate(req.body, __joiOptions);
	if (validation.error) {
		return res.send(response.error(400, validation.error.details[0].message, [] ));
	} else {
		next();
	}
}

exports.update = async (req, res) => {
	try {
		let userData = await User.findOne({_id:req.user._id});
		if(req.body.email && req.body.email != ""){
			let alreadyEmail = await User.findOne({_id:{$ne: req.user._id},email:req.body.email});
			if(alreadyEmail){
				return res.send(response.error(400, 'email id already exists', [] ));	
			}
			userData.email = req.body.email;
		}
		if(req.body.mobile_no && req.body.mobile_no != ""){
			userData.mobile_no = req.body.mobile_no;
		}
		if(req.body.full_name && req.body.full_name != ""){
			userData.full_name = req.body.full_name;
		}
		if (req.files) {
			let profile_image = req.files.profile_image;
			let uploadPath = __basedir + '/public/uploads/';
			let fileName;

			if (profile_image) {
				if (profile_image.mimetype !== "image/png" && profile_image.mimetype !== "image/jpg" && profile_image.mimetype !== "image/jpeg"){
					return res.send(response.error(400, 'File format should be PNG,JPG,JPEG', []));
				}
				if (profile_image.size >= (1024 * 1024 * 5)) { // if getter then 5MB
					return res.send(response.error(400, 'Image must be less then 5MB', []));
				}
				fileName = 'profile-image-' + Date.now() + path.extname(profile_image.name);
				profile_image.mv(uploadPath + fileName, function(err) {
					if (err){
						return res.send(response.error(400, 'Image uploading failed', []));
					}
				});
				userData.profile_image = '/public/uploads/' + fileName;
			}
		}
		if(req.body.address && req.body.address != ""){
			userData.address = req.body.address;
		}
		if(req.body.password && req.body.password != ""){
			if(req.body.old_password && req.body.old_password != ""){
				if(req.body.old_password != userData.password){
					return res.send(response.error(400, 'Old password is not currenct', [] ));	
				}
			}
			userData.password = await bcrypt.hash(req.body.password, 10);
		}
		await userData.save();
		delete userData.password;
		return res.send(response.success(200, 'Update Profile Successfully', UserResource(userData)));
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
// Register Api 
exports.register = async (req, res) => {
	try {
		const existsUser = await User.findOne({ email: req.body.email });
		if(existsUser) {
			return res.send(response.error(400, 'email id already exists', [] ));
        }

		const registerUser = new User({
			full_name: req.body.full_name,
			email: req.body.email,
			mobile_no: req.body.mobile_no,
			password: req.body.password,
			position: req.body.position,
		});

		let registerUserData = await registerUser.save();
		registerUserData = JSON.parse(JSON.stringify(registerUserData));
		delete registerUserData.password;

		const token = await registerUser.generatingAuthToken(); // generate token
		registerUserData.token = token; // added token in user document

		await User.findOneAndUpdate({_id: registerUserData._id}, {tokens: [{token: token, signedAt: new Date() }] }); //store tokens

		return res.send(response.success(200, 'Registration Success', UserResource(registerUserData)));
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

// To verify email call back:
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

// Verify email success
exports.verifiedEmailSuccess = async (req, res) => {
	return res.render('auth/verifyEmailSuccess');
}

exports.logout = async (req, res) => {
	if (req.headers && req.headers.authorization) {
		const token = req.headers.authorization.split(' ')[1]
		if (!token) {
			return res.send(response.error(401, 'Authorization fail!', [] ));
		} 
		const tokens = req.user.tokens;
		const newTokens = tokens.filter(t => t.token !== token);
		await User.findOneAndUpdate({_id: req.user._id}, {tokens: newTokens});
	}
	return res.send(response.success(200, 'logout Successfully', [] ));
}

// Login Api
exports.login = async (req, res) => {
	try {
		const email = req.body.email;
		const password = req.body.password;

		let userData = await User.findOne({ email: email }).select("+password");
		if (userData && userData.password) {
			const isMatch = await bcrypt.compare(password, userData.password);
			if (isMatch) {
				const token = await userData.generatingAuthToken(); // generate token
				
				if(req.body.device_token && req.body.device_token!= ""){
					userData.device_token = req.body.device_token;
				}
				if(req.body.device_type && req.body.device_type!= ""){
					userData.device_type = req.body.device_type;
				}

				userData.token = token; // add token in user document
				oldTokens = userData.tokens || []; //get old tokens
				oldTokens = oldTokens.slice(Math.max(oldTokens.length - 4, 0)); //get last 4 tokens
				
				await User.findOneAndUpdate({_id: userData._id}, {tokens: [...oldTokens ,{token: token, signedAt: new Date()}] }, {new:true,runValidators:true}); //update add new tokens
				delete userData['password']; // remove password in user data
				return res.status(200).send({
					"status": true,
					"status_code": "200",
					"message": "Login success",
					urlPath: process.env.PUBLIC_URL,
					data: UserResource(userData)
				});
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

// Forget Password
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
			const emailVerifyUrl = req.protocol + '://' + req.get('host') + process.env.BASE_URL + 'reset-password/'+ encryptedId.key + '/' + encryptedId.id;
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

// Reset password (Website)
exports.resetPasswordWeb = async (req, res) => {
	const _id = decrypt(req.params.key, req.params.id);
	const userData = await User.findOne({ _id: _id });
	if (userData && userData.reset_password_status == 1) {
		return res.render('auth/resetPassword', { key: req.params.key, id: req.params.id });
	} else {
		return res.render('errors/main',{ code: 400, errorMessage: 'Data Not found'});
	}
}

// Reset Password Api
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

// Reset password success page (Website)
exports.resetPasswordSuccess = async (req, res) => {
	return res.render('auth/resetPasswordSuccess');
}