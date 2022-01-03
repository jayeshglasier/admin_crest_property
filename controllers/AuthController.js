var express = require('express');
const bcrypt = require("bcryptjs");
var bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const {errorLog,consoleLog} = require("../helper/consoleLog");
const { encrypt, decrypt } = require('../helper/crypto');
var urlencodeParser = bodyParser.urlencoded({ extended: false });
const AuthController = require('../controllers/admin/AuthController');
const User = require("../models/User");

var validator = require('express-validator');

var axios = require("axios");

module.exports = function (app) {

	// Inner Auth
	app.get('/auth-login', function (req, res) {
		res.locals = { title: 'Login' };
		res.render('AuthInner/auth-login');
	});
	app.get('/auth-login-2', function (req, res) {
		res.locals = { title: 'Login 2' };
		res.render('AuthInner/auth-login-2');
	});
	app.get('/auth-register', function (req, res) {
		res.locals = { title: 'Register' };
		res.render('AuthInner/auth-register');
	});
	app.get('/auth-register-2', function (req, res) {
		res.locals = { title: 'Register 2' };
		res.render('AuthInner/auth-register-2');
	});
	app.get('/auth-recoverpw', function (req, res) {
		res.locals = { title: 'Recoverpw' };
		res.render('AuthInner/auth-recoverpw');
	});
	app.get('/auth-recoverpw-2', function (req, res) {
		res.locals = { title: 'Recoverpw 2' };
		res.render('AuthInner/auth-recoverpw-2');
	});
	app.get('/auth-lock-screen', function (req, res) {
		res.locals = { title: 'Lock Screen' };
		res.render('AuthInner/auth-lock-screen');
	});
	app.get('/auth-lock-screen-2', function (req, res) {
		res.locals = { title: 'Lock Screen 2' };
		res.render('AuthInner/auth-lock-screen-2');
	});
	app.get('/auth-confirm-mail', function (req, res) {
		res.locals = { title: 'Confirm Mail' };
		res.render('AuthInner/auth-confirm-mail');
	});
	app.get('/auth-confirm-mail-2', function (req, res) {
		res.locals = { title: 'Confirm Mail 2' };
		res.render('AuthInner/auth-confirm-mail-2');
	});
	app.get('/auth-email-verification', function (req, res) {
		res.locals = { title: 'Email verification' };
		res.render('AuthInner/auth-email-verification');
	});
	app.get('/auth-email-verification-2', function (req, res) {
		res.locals = { title: 'Email verification 2' };
		res.render('AuthInner/auth-email-verification-2');
	});
	app.get('/auth-two-step-verification', function (req, res) {
		res.locals = { title: 'Two step verification' };
		res.render('AuthInner/auth-two-step-verification');
	});
	app.get('/auth-two-step-verification-2', function (req, res) {
		res.locals = { title: 'Two step verification 2' };
		res.render('AuthInner/auth-two-step-verification-2');
	});

	// Crypto
	app.get('/crypto-ico-landing', function (req, res) {
		res.locals = { title: 'Crypto Ico Landing' };
		res.render('Crypto/crypto-ico-landing');
	});


	// Auth Pages

	app.get('/pages-maintenance', function (req, res) {
		res.locals = { title: 'Pages Maintenance' };
		res.render('Pages/pages-maintenance');
	});
	app.get('/pages-comingsoon', function (req, res) {
		res.locals = { title: 'Pages Comingsoon' };
		res.render('Pages/pages-comingsoon');
	});

	app.get('/pages-404', function (req, res) {
		res.locals = { title: 'Pages 404' };
		res.render('Pages/pages-404');
	});
	app.get('/pages-500', function (req, res) {
		res.locals = { title: 'Pages 500' };
		res.render('Pages/pages-500');
	});


	app.get('/register', function (req, res) {
		if (req.user) { res.redirect('Dashboard/index'); }
		else {
			res.render('Auth/auth-register', { 'message': req.flash('message'), 'error': req.flash('error') });
		}
	});

	app.post('/post-register', urlencodeParser, function (req, res) {
		let tempUser = { username: req.body.username, email: req.body.email, password: req.body.password };
		users.push(tempUser);

		// Assign value in session
		sess = req.session;
		sess.user = tempUser;

		res.redirect('/');
	});

	app.get('/login', function (req, res) {
		res.render('Auth/auth-login', { 'message': req.flash('message'), 'error': req.flash('error') });
	});

	app.post('/post-login', urlencodeParser, async function (req, res) {

		const email = req.body.email;
		const password = req.body.password;

		let userData = await User.findOne({ email: email }).select("+password");
		if (userData && userData.password) {

			const isMatch = await bcrypt.compare(password, userData.password);
			if (isMatch) {
				// Assign value in session
				sess = req.session;
				sess.user = userData;
				res.redirect('/');	
			}else{
				req.flash('error', 'Incorrect password!');
				res.redirect('/login');
			}
		} else {
			req.flash('error', 'Incorrect email or password!');
			res.redirect('/login');
		}
	});

	app.get('/forgot-password', function (req, res) {
		res.render('Auth/auth-forgot-password', { 'message': req.flash('message'), 'error': req.flash('error') });
	});

	app.post('/post-forgot-password', urlencodeParser, async function (req, res) {
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
				// return res.send(response.success(200, 'Email Send Successfully', [] ));
				req.flash('message', 'We have e-mailed your password reset link!');
				res.redirect('/forgot-password');
			} else {
				req.flash('error', 'Email Not Found!!');
				res.redirect('/forgot-password');
			}
		} catch (error) {
			console.log(error);
			req.flash('error', 'Something want wrong!!');
			res.redirect('/forgot-password');
		}
	});

	app.get('/logout', function (req, res) {
		// Assign null value in session
		sess = req.session;
		sess.user = null;
		res.redirect('/login');
	});

	app.get("/reset-password/:key/:id", AuthController.resetPasswordWeb); // Reset Password web page
	app.post("/reset-password/:key/:id", urlencodeParser, AuthController.resetPassword); // Reset Password
	app.get("/reset-password-success/", AuthController.resetPasswordSuccess); // success message
};