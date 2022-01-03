const User = require("../../models/User");
const fs = require('fs')
const path = require('path');
const bcrypt = require("bcryptjs");
const response = require("../../helper/response");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const {errorLog} = require("../../helper/consoleLog");
const UserResource = require('../resources/UserResource');
const Joi = require("joi");
const Property = require('../../models/Property');
const UserProperty = require('../../models/UserProperty');
const { check, validationResult, matchedData } = require('express-validator');

// Supervisor add Form Validation
exports.supervisorAddValidation = async (req, res, next) => {
	const schema = Joi.object({
		full_name: Joi.string().min(3).max(150).required(),
		email: Joi.string().min(6).max(100).required().email(),
		mobile_no: Joi.string().min(6).max(12).required(),
		password: Joi.string().min(6).max(30).required(),
	});
	const validation = schema.validate(req.body, __joiOptions);
	if (validation.error) {
		return res.send(response.error(400, validation.error.details[0].message, [] ));
	} else {
		next();
	}
}

// Supervisor add api 
exports.supervisorAdd = async (req, res) => {
	try {
		const existsUser = await User.findOne({ email: req.body.email });
		if(existsUser) {
			return res.send(response.error(400, 'email id already exists', [] ));
        }

        if (req.files) {
			let profile_image = req.files.profile_image;
			let uploadPath = __basedir + '/public/images/users/';
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
				req.body.profile_image = '/public/images/users/' + fileName;
			}
		}

		const registerUser = new User({
			full_name: req.body.full_name,
			email: req.body.email,
			mobile_no: req.body.mobile_no,
            password: req.body.password,
            profile_image:req.body.profile_image,
			position: 5, // supervisor type
		});
		const registeredData = await registerUser.save();
		const userDataJson = JSON.parse(JSON.stringify(registeredData));
		delete userDataJson.password;

		return res.send(response.success(200, 'Supervisor Added Success', UserResource(userDataJson)));
	} catch (error) {
		let errorMessage = '';
		if (error.name == "ValidationError") {
			errorMessage = error.errors[Object.keys(error.errors)[0]];
			errorMessage = errorMessage.message;
		} else {
			errorLog(__filename, req.originalUrl, error);
			errorMessage = "Something want wrong";
		}
		req.session.error = {errorMessage: errorMessage,inputData: req.body};
		return res.redirect('back');
	}
}

// User Create Page
exports.userCreate = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		res.locals = { title: 'Create User', session:req.session};
		res.locals.error = req.session.error ? req.session.error : '';

		let UserData = await User.find({position: 5});
		let propertyData = await Property.find();

		console.log(propertyData);

		return res.render('Admin/Users/create',{ data: UserResource(UserData), propertyData: propertyData });
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		req.session.error = {errorMessage: "Something want wrong"};
		return res.redirect('back');
	}
}

// User create Form Validation
exports.userAddValidation = [
	check('full_name').trim().notEmpty().withMessage('full name is required'),
	check('mobile_no').trim().notEmpty().withMessage('mobile no is required')
		.isNumeric().withMessage('mobile no is must be numeric'),
	check('position_id').trim().notEmpty().withMessage('position is required'),
	check('address').trim().notEmpty().withMessage('address is required'),
	check('password').trim().notEmpty().withMessage('password is required'),
	check('email').trim().notEmpty().withMessage('email is required')
		.normalizeEmail().isEmail().withMessage('must be a valid email')
		.custom(value => {
			return User.findOne({email: value}).then((user) => { if (user) {return Promise.reject('E-mail already exists')} })
		}),
];

// create user data
exports.userAdd = async (req, res) => {
	try {
		req.body.property_id = Array.isArray(req.body['property_id[]']) ? req.body['property_id[]'] : [req.body['property_id[]']];

		const errors= validationResult(req);
        if(!errors.isEmpty()){
			let errMsg = errors.mapped();
			req.session.error = {errMsg: errMsg, inputData: req.body};
			return res.redirect('back');
		} else {
			req.session.error = '';
		}	

        if (req.files && req.files.profile_image) {
			let profile_image = req.files.profile_image;
			let uploadPath = __basedir + '/public/images/users/';
			let fileName;

			if (profile_image.mimetype !== "image/png" && profile_image.mimetype !== "image/jpg" && profile_image.mimetype !== "image/jpeg"){
				let errMsg = { profile_image: { msg: 'profile image File format should be PNG,JPG,JPEG' } };
				req.session.error = {errMsg: errMsg, inputData: req.body};
				return res.redirect('back');
			}
			if (profile_image.size >= (1024 * 1024 * 5)) { // if getter then 5MB
				let errMsg = { profile_image: { msg: 'profile image must be less then 5MB' } };
				req.session.error = {errMsg: errMsg, inputData: req.body};
				return res.redirect('back');
			}
			fileName = 'profile-image-' + Date.now() + path.extname(profile_image.name);
			profile_image.mv(uploadPath + fileName, function(err) {
				if (err){
					let errMsg = { profile_image: { msg: 'profile image uploading failed' } };
					req.session.error = {errMsg: errMsg, inputData: req.body};
					return res.redirect('back');
				}
			});
			req.body.profile_image = '/public/images/users/' + fileName;
		} else {
			let errMsg = { profile_image: { msg: 'profile image is required' } };
			req.session.error = {errMsg: errMsg, inputData: req.body};
			return res.redirect('back');
		}

		let positionType = '';
		if(req.body.position_id == 2){
			positionType = "Operation Team";
		}else if(req.body.position_id == 3){
			positionType = "Auditor";
		}else if(req.body.position_id == 4){
			positionType = "Manager";
		}else if(req.body.position_id == 5){
			positionType = "Supervisor";
		}else{
			positionType = "";
		}

		let registerUser = new User({
			full_name: req.body.full_name,
			email: req.body.email,
			mobile_no: req.body.mobile_no,
			address: req.body.address,
            password: req.body.password,
			profile_image: req.body.profile_image,
			property_id: req.body.property_id, // Property list
			position_id: req.body.position_id, // user type id
			position_type: positionType, // user type
		});
		await registerUser.save();

		req.body.property_id = Array.isArray(req.body.property_id) ? req.body.property_id : [req.body.property_id];
		for (let i = 0; i < req.body.property_id.length; i++) {
			const property_id = req.body.property_id[i];
			if (registerUser._id && property_id && ObjectId.isValid(property_id) == true) {
				let UserPropertyData = new UserProperty({
					userId: registerUser._id,
					propertyId: property_id,
				});
				await UserPropertyData.save();
			}
		}

		res.redirect('/users');
	} catch (error) {
		let errorMessage = '';
		if (error.name == "ValidationError") {
			errorMessage = error.errors[Object.keys(error.errors)[0]];
			errorMessage = errorMessage.message;
		} else {
			errorLog(__filename, req.originalUrl, error);
			errorMessage = "Something want wrong";
		}
		req.session.error = {errorMessage: errorMessage,inputData: req.body};
		return res.redirect('back');
	}
}

// Supervisor list page
exports.supervisorList = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		res.locals = { title: 'Users', session:req.session};
		let UserData = await User.find({position: 5});
		return res.render('Admin/Users/index',{'data':UserResource(UserData)});
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		req.session.error = {errorMessage: "Something want wrong"};
		return res.redirect('back');
	}
}

// Users list page
exports.userList = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		res.locals = { title: 'Users', session: req.session};
		req.session.error =  '';

		let page = 1;
		if(req.query.page != undefined){
			page = req.query.page;
		}
		let limit = { $limit : 10};
		let skip = { $skip : (page - 1) * 10};
		let project = {
			$project:{
				email:1,
				password:1,
				full_name:1,
				mobile_no:1,
				address:1,
				position_id:1,
				position_type:1,
				profile_image:1,
				status:1,
				level:1
			}
		}

		let query1 = {};
		if(req.query.search){
			query1['full_name'] = {$regex: new RegExp(req.query.search, 'i')};
		}
		let search = {"$match": {$or: [query1]}};
		
		let totalProperty = await User.count(query1);
		totalPage = Math.ceil(totalProperty/10);
		let sort = {
            $sort:{
                createdAt:-1
            }
        };
		let UserData = await User.aggregate([search,sort,skip,limit,project]);

		return res.render('Admin/Users/index',{data: UserData,page:page,totalPage:totalPage,search:req.query.search?req.query.search:""});
		//return res.render('Admin/Users/index',{'data':UserResource(UserData)});
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		req.session.error = {errorMessage: "Something want wrong"};
		return res.redirect('back');
	}
}

// User edit Page
exports.userEdit = async (req,res) => {
	try {
		res.locals = { title: 'Update User', session: req.session };
		res.locals.error = req.session.error ? req.session.error : '';
		
		let UserData = await User.findOne({_id: req.params.id});
		let UserPropertyData = await UserProperty.find({userId: req.params.id});
		let propertyData = await Property.find();
		return res.render('Admin/Users/edit',{ data: UserResource(UserData), propertyData: propertyData, UserPropertyData: UserPropertyData });
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		req.session.error = {errorMessage: "Something want wrong"};
		return res.redirect('back');
	}
}

exports.userUpdateValidation = [
	check('_id').trim().notEmpty().withMessage('User Id required'),
	check('full_name').trim().notEmpty().withMessage('full name is required'),
	check('email').trim().notEmpty().withMessage('email is required')
		.normalizeEmail().isEmail().withMessage('must be a valid email'),
	check('mobile_no').trim().notEmpty().withMessage('mobile no is required')
		.isNumeric().withMessage('mobile no is must be numeric'),
	check('position_id').trim().notEmpty().withMessage('position is required'),
	check('address').trim().notEmpty().withMessage('address is required'),
];

// User update
exports.userUpdate = async (req,res) => {
	try {
		req.body.property_id = Array.isArray(req.body['property_id[]']) ? req.body['property_id[]'] : [req.body['property_id[]']];

		res.locals = { title: 'Update User', session: req.session};
		let oldUserData = await User.findOne({_id: req.body._id});
		
		const errors= validationResult(req);
        if(!errors.isEmpty()){
			let errMsg= errors.mapped();
			req.session.error = {errMsg: errMsg, inputData: req.body};
			return res.redirect('back');
        } else if(oldUserData.email != req.body.email) {
			const existsUser = await User.findOne({ email: req.body.email });
			if(existsUser) {
				let errMsg= errors.mapped();
				req.session.error = {errMsg: errMsg, inputData: req.body};
				return res.redirect('back');
			}
		} else {
			req.session.error = '';
		}

        if (req.files) {
			let profile_image = req.files.profile_image;
			let uploadPath = __basedir + '/public/images/users/';
			let fileName;

			if (profile_image) {
				if (profile_image.mimetype !== "image/png" && profile_image.mimetype !== "image/jpg" && profile_image.mimetype !== "image/jpeg"){
					req.session.error = {errorMessage: "File format should be PNG,JPG,JPEG"};
					return res.redirect('back');
				}
				if (profile_image.size >= (1024 * 1024 * 5)) { // if getter then 5MB
					req.session.error = {errorMessage: "Image must be less then 5MB"};
					return res.redirect('back');
				}
				fileName = 'profile-image-' + Date.now() + path.extname(profile_image.name);
				profile_image.mv(uploadPath + fileName, function(err) {
					if (err){
						req.session.error = {errorMessage: "Image uploading failed"};
						return res.redirect('back');
					}
				});
				req.body.profile_image = '/public/images/users/' + fileName;
			}
		}

		let positionType = '';
		if(req.body.position_id == 2){
			positionType = "Operation Team";
		}else if(req.body.position_id == 3){
			positionType = "Auditor";
		}else if(req.body.position_id == 4){
			positionType = "Manager";
		}else if(req.body.position_id == 5){
			positionType = "Supervisor";
		}else{
			positionType = "";
		}

		let UserData = await User.findOne({_id: req.body._id});
		UserData.full_name = req.body.full_name;
		UserData.email = req.body.email;
		UserData.mobile_no = req.body.mobile_no;
		UserData.address = req.body.address;
		UserData.position_id = req.body.position_id;
		UserData.position_type = positionType; // user type
		UserData.property_id = req.body.property_id;
		UserData.profile_image = req.body.profile_image;
		await UserData.save();

		req.body.property_id = Array.isArray(req.body.property_id) ? req.body.property_id : [req.body.property_id];
		let deleteOldUserProperty = await UserProperty.deleteMany({ userId: UserData._id });
		for (let i = 0; i < req.body.property_id.length; i++) {
			const property_id = req.body.property_id[i];
			if (UserData._id && property_id && ObjectId.isValid(property_id) == true) {
				let UserPropertyData = new UserProperty({
					userId: UserData._id,
					propertyId: property_id,
				});
				await UserPropertyData.save();
			}
		}

		return res.redirect('/users');
	} catch (error) {
		let errorMessage = '';
		if (error.name == "ValidationError") {
			errorMessage = error.errors[Object.keys(error.errors)[0]];
			errorMessage = errorMessage.message;
		} else {
			errorLog(__filename, req.originalUrl, error);
			errorMessage = "Something want wrong";
		}
		req.session.error = {errorMessage: errorMessage,inputData: req.body};
		return res.redirect('back');
	}
}

// User View Page
exports.userView = async (req,res) => {
	try {
		res.locals = { title: 'View User', session: req.session};

		let UserData = await User.findOne({ _id: req.params.id, position: 5});
		let UserPropertyData = await UserProperty.find({ userId: req.params.id}).populate({path: 'propertyId'}).lean();

		return res.render('Admin/Users/view',{ data: UserResource(UserData), UserPropertyData: UserPropertyData });
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		req.session.error = {errorMessage: "Something want wrong"};
		return res.redirect('back');
	}
}

exports.updateUserStatus = async (req, res) => {
	try {
		let schema = Joi.object({
			user_id: Joi.required()
		});
		let validation = schema.validate(req.body, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}

		let userDetail = await User.findOne({_id: req.body.user_id});
		if(userDetail.status == 0) {
			userDetail.status = 1;
		} else {
			userDetail.status = 0;
		}
		userDetail.save();

		return res.send(response.success(200, 'Status update Successfully', userDetail.status));
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.success(500, 'Something want wrong', []));
	}
}

exports.changePassword = async (req, res) => {
	try {
		const _id = req.user._id;
		const userData = await User.findOne({ _id: _id }).select("+password");
		if (userData) {
			const isMatch = await bcrypt.compare(req.body.old_password, userData.password);
			if (isMatch) {
				const updateUser = await User.findByIdAndUpdate(_id, {password: req.body.new_password}, {new : true, runValidators: true} );
				return res.send(response.success(200, 'Password Change successfully', []));
			} else {
				return res.send(response.error(400, 'Currant Password is wrong', []));
			}
		} else {
			return res.send(response.error(400, 'Data Not found', []));
		}
	} catch (error) {
		let errorMessage = '';
		if (error.name == "ValidationError") {
			errorMessage = error.errors[Object.keys(error.errors)[0]];
			errorMessage = errorMessage.message;
		} else {
			errorLog(__filename, req.originalUrl, error);
			errorMessage = "Something want wrong";
		}
		req.session.error = {errorMessage: errorMessage,inputData: req.body};
		return res.redirect('back');
	}
}

exports.deleteUser = async (req, res) => {
	try {
		const deleteUser = await User.findByIdAndDelete(req.user._id);
		if (deleteUser) {
			return res.send(response.success(200, 'User is Deleted', []));
		} else {
			return res.send(response.error(400, 'User not found', []));
		}
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		req.session.error = {errorMessage: "Something want wrong"};
		return res.redirect('back');
	}
}

// Page Not Found
exports.pageNotFound = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		res.locals = { title: 'Users', session:req.session};

		let UserData = await User.find({position: 5});
		return res.render('Pages/pages-404',{'data':UserResource(UserData)});
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		req.session.error = {errorMessage: "Something want wrong"};
		return res.redirect('back');
	}
}