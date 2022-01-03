const User = require("../../models/User");
const Property = require("../../models/Property");
const UserProperty = require('../../models/UserProperty');
const Task = require("../../models/propertyTask");
const Category = require("../../models/Category");
const CategoryCheckList = require("../../models/CategoryCheckList");
const fs = require('fs')
const path = require('path');
const bcrypt = require("bcryptjs");
const response = require("../../helper/response");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const {errorLog} = require("../../helper/consoleLog");
const UserResource = require('../resources/UserResource');
const Joi = require("joi");

exports.changePasswordValidation = async (req, res, next) => {
	const schema = Joi.object({
		new_password: Joi.string().min(6).max(30).required(),
		old_password: Joi.string().min(6).max(30).required(),
	});
	const validation = schema.validate(req.body, __joiOptions);
	if (validation.error) {
		return res.send(response.error(400, validation.error.details[0].message, [] ));
	} else {
		next();
	}
}

// Supervisor add Form Validatation
exports.userAddValidation = async (req, res, next) => {
	const schema = Joi.object({
		full_name: Joi.string().min(3).max(150).required(),
		email: Joi.string().min(6).max(100).required().email(),
		mobile_no: Joi.string().min(6).max(12).required(),
		position_id: Joi.string().min(1).max(1).required(),
		property_id: Joi.string().min(24).max(24).required(),
	});
	const validation = schema.validate(req.body, __joiOptions);
	if (validation.error) {
		return res.send(response.error(400, validation.error.details[0].message, [] ));
	} else {
		next();
	}
}

// Users add api 
exports.addUsers = async (req, res) => {
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

		if(req.body.position_id == 4){
			positionType = "Manager";
		}else if(req.body.position_id == 5){
			positionType = "Supervisor";
		}else{
			positionType = "";
		}

		req.body.property_id = Array.isArray(req.body['property_id']) ? req.body['property_id'] : [req.body['property_id']];

		const registerUser = new User({
			full_name: req.body.full_name,
			email: req.body.email,
			mobile_no: req.body.mobile_no,
            password: '123456',
            profile_image:req.body.profile_image,
			position_id: req.body.position_id, // user type
			position_type: positionType,
			property_id: req.body.property_id, // Property list
		});
		const registeredData = await registerUser.save();

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

		const userDataJson = JSON.parse(JSON.stringify(registeredData));
		delete userDataJson.password;

		return res.send(response.success(200, 'User create success!', UserResource(userDataJson)));
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

exports.supervisorList = async (req,res) => {
	try {
		let userData = await User.findOne({_id:req.user._id});
		let condition = {"$match": {property_id: {$in:userData.property_id},status:1,position_id:5}};
		let project = {
			$project : {
				"full_name" : "$full_name",
				"profile_image" : "$profile_image",
				"status" : "$status",
			}
		}
		let supervisorList = await User.aggregate([condition,project])
		return res.status(200).send({
		    "status": true,
			"status_code": "200",
			"message": "Supervisor list",
			urlPath: process.env.PUBLIC_URL,
		    data: supervisorList
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

exports.managerList = async (req, res) => {
	try {
		let userData = await User.findOne({_id:req.user._id});
		let condition = {"$match": {property_id: {$in:userData.property_id},status:1,position_id:4}};
		let project = {
			$project : {
				"full_name" : "$full_name",
				"profile_image" : "$profile_image",
				"status" : "$status",
			}
		}
		let managerList = await User.aggregate([condition,project])
		return res.status(200).send({
		    "status": true,
			"status_code": "200",
			"message": "Manager list",
			urlPath: process.env.PUBLIC_URL,
		    data: managerList
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}


exports.userProfile = async (req, res) => {
	try {
		let UserData = await User.findOne({_id: req.user._id});
		UserData = JSON.parse(JSON.stringify(UserData));
		return res.status(200).send({
		    "status": true,
			"status_code": "200",
			"message": "User profile details",
		    urlPath: process.env.PUBLIC_URL,
		    data: UserResource(UserData)
		});
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

exports.updateUser = async (req, res) => {0
	try {
		const validation = User.userValidate(req.body); //user data validation
		if (validation.error){ //if any error message
			return res.send(response.error(400, validation.error.details[0].message, [] ));
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
				req.body.profile_image = '/public/uploads/' + fileName;
			}
		}

		// remove null or blank value key remove
		Object.keys(req.body).forEach((key) => { if(req.body[key] == '' || req.body[key] == null || req.body[key] == 'undefined') delete req.body[key] });

		req.body.registration_status = 1;
		const updates = Object.keys(req.body);
		const allowedUpdates = ['name', 'birth_date', 'gender', 'interest', 'about', 'city', 'hometown', 'language', 'occupation', 'height', 'children', 'edu_qualification', 'relationship_status', 'smoking','profile_image','registration_status'];
		const isValidOperation = updates.every((update) =>  allowedUpdates.includes(update));
		if (!isValidOperation) {
			return res.send(response.error(400, 'Invalid update fields!', [] ));
		}
		const _id = req.user._id;

		let updateUser = await User.findByIdAndUpdate(_id, req.body, {new: true, runValidators: true} );
		updateUser = JSON.parse(JSON.stringify(updateUser));
        updateUser.token = req.user.token;
        
		return res.send(response.success(200, 'success', UserResource(updateUser)));
	} catch (error) {
		if (error.name == "ValidationError") {
			const errorMessage = error.errors[Object.keys(error.errors)[0]];
			return res.send(response.error(400, errorMessage.message, []));
		} else {
			errorLog(__filename, req.originalUrl, error);
			return res.send(response.error(500, 'Something want wrong', []));
		}
	}
}

exports.profileImageUpload = async (req, res) => {
	try {
		if (req.files && req.files.profile_image) {
			let profile_image = req.files.profile_image;
			let uploadPath = __basedir + '/public/images/users/';

			const extensionName = path.extname(profile_image.name);
			const allowedExtension = ['.png','.jpg','.jpeg'];
			if(!allowedExtension.includes(extensionName)){
				return res.send(response.error(422, 'File format should be PNG,JPG,JPEG', []));
			}

			if (profile_image.mimetype !== "image/png" && profile_image.mimetype !== "image/jpg" && profile_image.mimetype !== "image/jpeg"){
				return res.send(response.error(400, 'File format should be PNG,JPG,JPEG', []));
			}
			if (profile_image.size >= (1024 * 1024 * 5)) { // if getter then 5MB
				return res.send(response.error(400, 'Image must be less then 5MB', []));
			}
			let fileName = 'profile-image-' + Date.now() + path.extname(profile_image.name);
			profile_image.mv(uploadPath + fileName, function(err) {
				if (err){
					return res.send(response.error(400, 'Image uploading failed', []));
				}
			});
			fileName = '/public/images/users/' + fileName;
			const _id = req.user._id;
			let userData = await User.findByIdAndUpdate(_id, {profile_image: fileName}, {new : true, runValidators: true} );
			return res.send(response.success(200, 'uploaded profile image successfully', {"profile_image": process.env.PUBLIC_URL + userData.profile_image} ));
		} else {
			return res.send(response.error(400, 'Please select an image', [] ));
		}
	} catch (error) {
		if (error.name == "ValidationError") {
			const errorMessage = error.errors[Object.keys(error.errors)[0]];
			return res.send(response.error(400, errorMessage.message, []));
		} else {
			errorLog(__filename, req.originalUrl, error);
			return res.send(response.error(500, 'Something want wrong', []));
		}
	}
}

exports.albumImageUpload = async (req, res) => {
	try {
		if (req.files && req.files.album_images) {
			let album_images = req.files.album_images;
			let uploadPath = __basedir + '/public/uploads/';
			let albumImageNameArray = req.user.album_images;

			if (Array.isArray(album_images)) {
				album_images.forEach(album_image => {
					if (album_image.mimetype !== "image/png" && album_image.mimetype !== "image/jpg" && album_image.mimetype !== "image/jpeg"){
						return res.send(response.error(400, 'File format should be PNG,JPG,JPEG', []));
					}
					if (album_image.size >= (1024 * 1024 * 5)) { // if getter then 5MB
						return res.send(response.error(400, 'Image must be less then 5MB', []));
					}
				});
				album_images.forEach(album_image => {
					let randomNumber = Math.floor(Math.random() * 100) + 1; //0-99 random number
					fileName = 'album-image-' + Date.now() + randomNumber + path.extname(album_image.name);
					album_image.mv(uploadPath + fileName, function(err) {
						if (err){
							return res.send(response.error(400, 'Image uploading failed', []));
						}
					});
					albumImageNameArray.push('/public/uploads/' + fileName);
				});
			} else {
				if (album_images.mimetype !== "image/png" && album_images.mimetype !== "image/jpg" && album_images.mimetype !== "image/jpeg"){
					return res.send(response.error(400, 'File format should be PNG,JPG,JPEG', []));
				}
				fileName = 'album-image-' + Date.now() + path.extname(album_images.name);
				album_images.mv(uploadPath + fileName, function(err) {
					if (err){
						return res.send(response.error(400, 'Image uploading failed', []));
					}
				});
				albumImageNameArray.push('/public/uploads/' + fileName);
			}
			await User.findByIdAndUpdate(req.user._id, {album_images: albumImageNameArray}, {new : true, runValidators: true} );
			return res.send(response.success(200, 'uploaded album images successfully', []));
		} else {
			return res.send(response.error(400, 'Please select an image', [] ));
		}
	} catch (error) {
		if (error.name == "ValidationError") {
			const errorMessage = error.errors[Object.keys(error.errors)[0]];
			return res.send(response.error(400, errorMessage.message, []));
		} else {
			errorLog(__filename, req.originalUrl, error);
			return res.send(response.error(500, 'Something want wrong', []));
		}
	}
}

exports.albumImageDelete = async (req, res) => {
	try {
		const userData = await User.findOne({_id: req.user._id});
		const image_name = req.body.album_image_name;
		const DIR = "public/uploads";

		let existsAlbumImage = userData.album_images.filter(function(item) {
			if (item) { // if album_image name exists
				return item.toLowerCase().indexOf(image_name.toLowerCase()) >= 0;
			}
		});

		let fileExists = fs.existsSync(DIR +'/'+ image_name);

		if (existsAlbumImage.length > 0 && fileExists) {	
			fs.unlinkSync(DIR+'/'+image_name); // delete from directory

			const filteredAlbumImages = userData.album_images.filter(function(item) {
				if (item) { // album_image array remove deleted image name value
					return item.toLowerCase().indexOf(image_name.toLowerCase()) <= 0;
				}
			});
			const updateUser = await User.findByIdAndUpdate(req.user._id, {album_images: filteredAlbumImages}, {new : true, runValidators: true} );
			return res.send(response.success(200, 'Image Delete successfully', [] ));
		} else {
			return res.send(response.error(400, 'Image not exists', []));
		}
		
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
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
		if (error.name == "ValidationError") {
			const errorMessage = error.errors[Object.keys(error.errors)[0]];
			return res.send(response.error(400, errorMessage.message, []));
		} else {
			errorLog(__filename, req.originalUrl, error);
			return res.send(response.error(500, 'Something want wrong', []));
		}
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
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

exports.updateLocation = async (req,res) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = ['longitude','latitude'];
	const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
	if (!isValidOperation) {
		return res.send(response.error(400, 'Invalid update fields!', [] ));
	}
	try {
		const _id = req.user._id;
		const longitude = parseFloat(req.body.longitude);
		const latitude = parseFloat(req.body.latitude);
		const updateUsers = await User.findByIdAndUpdate(_id, { location: { type: "Point", coordinates: [longitude, latitude] } }, {new: true, runValidators: true} );

		const userData = {};
		userData.location = updateUsers.location;

		return res.send(response.success(200, 'location update successfully', []));
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}


exports.allUsersList = async (req,res) => {
	try {
		let UserData = await User.find().populate({path: 'question_answer.question_id'});
		// db.users.updateMany({gender: "2"}, {$set: {gender: 2}}) //in mongodb compass shell query

		return res.send(response.success(200, 'success', UserResource(UserData))); //UserResource(UserData)
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

exports.languageList = async (req,res) => {
	try {
		let ProfileLanguageData = await ProfileLanguage.find();
		return res.send(response.success(200, 'success', ProfileLanguageData));
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', [] ));
	}
}

exports.dashboardSliderImage = async (req,res) => {
	try {
		// let userData = await User.findOne({_id:req.user._id});
		// let condition = {"$match": {property_id: {$in:userData.property_id},status:1,position_id:5}};
		// let project = {
		// 	$project : {
		// 		"full_name" : "$full_name",
		// 		"profile_image" : "$profile_image",
		// 	}
		// }
		// let supervisorList = await User.aggregate([condition,project])

		let sliderImages = [{'_id':'6176f59d8617dfecff47c259','image':'/public/images/property/property-image-163670891146540.jpg'},
		{'_id':'6177f11fc350e7eebd3d4222','image':'/public/images/property/property-image-16367089114651.jpg'}];
		return res.status(200).send({
			"status": true,
		    "status_code": "200",
			"message": "Dashboard slider images",
			"urlPath": process.env.PUBLIC_URL,
		    data: sliderImages
		});
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', [] ));
	}
}

exports.userDetail = async (req, res) => {
	try {
		let schema = Joi.object({
			userId: Joi.string().min(24).max(24).required()
		});
		let validation = schema.validate(req.body, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let userData = await User.findOne({_id:req.body.userId},{full_name:1,profile_image:1,mobile_no:1,email:1,property_id:1});
		if(!userData){
			return res.send(response.error(400, 'User Not Found', []));
		}
		let condition = {"$match": {_id: {$in:userData.property_id} , status:1}};
		let wingCondition = {"$match": {"wings.status": {$ne:0}}};
		let unwind = {
            $unwind: {
                path: "$wings",
                preserveNullAndEmptyArrays: true
            }
        }
        let group = {
			$group:{
				_id:"$_id",
				property_name:{$first:"$property_name"},
				wings:{
					$push:{
						_id:"$wings._id",
						wingsName:"$wings.wings_name",
					}
				}
			}
		}
		let wingsData = await Property.aggregate([condition,unwind,wingCondition,group]);
		let usedCategory = await Task.distinct( "categoryId", { managerId:req.body.userId });
		userData = JSON.parse(JSON.stringify(userData));
		let allCategory = [];
		if(usedCategory.length > 0){
			allCategory = await Category.find({_id: {$in: usedCategory},status:1},{category_name:1});
		}
		delete userData.property_id;
		return res.status(200).send({
		    "status": true,
			"status_code": "200",
			"message": "User details",
		    urlPath: process.env.PUBLIC_URL,
		    data:[{"category": allCategory,
		    "userData": [userData],
		    "wingsData":wingsData}]
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

exports.activeInactiveStatus = async (req, res) => {
	try {
		let schema = Joi.object({
			userId: Joi.string().min(24).max(24).required(),
			status: Joi.string().min(1).max(1).required() // 0 = Inactive & 1 = Active
		});
		let validation = schema.validate(req.body, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		if(req.body.userId){
			const language = await User.findByIdAndUpdate(req.body.userId, {status: req.body.status}, {new: true, runValidators: true});
		}
		return res.send(response.success(200, 'Status changes successfully', []));
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
