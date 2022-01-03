const User = require("../../models/User");
const Property = require("../../models/Property");
const Category = require("../../models/Category");
const path = require('path');
const response = require("../../helper/response");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const {errorLog} = require("../../helper/consoleLog");
const PropertyResource = require('../resources/PropertyResource');
const { check, validationResult } = require('express-validator');
const Joi = require("joi");

// Property add form validatation
exports.propertyAddValidation = [
	check('address').trim().notEmpty().withMessage('Address is required'),
	check('latitude').trim().notEmpty().withMessage('Latitude is required'),
	check('longitude').trim().notEmpty().withMessage('Longitude is required'),
	check('property_name').trim().notEmpty().withMessage('Property name is required')
		.custom(value => {
			return Property.findOne({property_name: value}).then((property) => { if (property) {return Promise.reject('Property name already exists')} })
		}),
];

// Property add api
exports.updatePropertyStatus = async (req, res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		let schema = Joi.object({
			propertyId: Joi.required()
		});
		let validation = schema.validate(req.body, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let propertyDetail = await Property.findOne({_id:req.body.propertyId});
		if(propertyDetail.status == 0){
			propertyDetail.status = 1;
		}else{
			propertyDetail.status = 0;
		}
		propertyDetail.save();
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    "message": "Status updated successfully"
		});
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.deletePropertyImage = async (req, res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		let schema = Joi.object({
			propertyId: Joi.required(),
			imageIndex: Joi.required()
		});
		let validation = schema.validate(req.body, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let propertyDetail = await Property.findOne({_id:req.body.propertyId});
		propertyDetail.property_images.splice(req.body.imageIndex,1);
		propertyDetail.markModified("property_images");
		propertyDetail.save();
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    "message": "Image deleted successfully"
		});
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.updatePropertyWingsStatus = async (req, res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		let schema = Joi.object({
			propertyId: Joi.required(),
			wingId: Joi.required()
		});
		let validation = schema.validate(req.body, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let propertyDetail = await Property.findOne({_id:req.body.propertyId});
		let index = propertyDetail.wings.findIndex((x)=> String(x._id) == req.body.wingId);
		if(index == -1){
			return res.redirect('/ppm');
		}
		if(propertyDetail.wings[index].status == 0){
			propertyDetail.wings[index].status = 1;
		}else{
			propertyDetail.wings[index].status = 0;
		}
		propertyDetail.markModified("wings");
		propertyDetail.save();
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    "message": "Status updated successfully"
		});
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.propertyAdd = async (req, res) => {
	try {
		res.locals = { title: 'Add New Properties', session:req.session};

		const errors= validationResult(req);
        if(!errors.isEmpty()){
			let errMsg = errors.mapped();
			req.session.error = {errMsg: errMsg, inputData: req.body};
			return res.redirect('back');
		} else {
			req.session.error = '';
		}

		const existsUser = await Property.findOne({ property_name: req.body.property_name });
		if(existsUser) {
			req.session.error = {errorMessage: 'Property name already exists',inputData: req.body};
			return res.redirect('back');
		}
		let propertyImageNameArray = [];
		let wingsNameArray = [];
		
		if (req.files && req.files.property_images) {
			let property_images = req.files.property_images;
			let uploadPath = __basedir + '/public/images/property/';

			property_images = Array.isArray(property_images) ? property_images : [property_images];

			if (Array.isArray(property_images)) {
				property_images.forEach(pro_image => {
					if (pro_image.mimetype !== "image/png" && pro_image.mimetype !== "image/jpg" && pro_image.mimetype !== "image/jpeg"){
						return res.send(response.error(400, 'File format should be PNG,JPG,JPEG', []));
					}
					if (pro_image.size >= (1024 * 1024 * 5)) { // if getter then 5MB
						return res.send(response.error(400, 'Image must be less then 5MB', []));
					}
				});
				property_images.forEach(pro_image => {
					let randomNumber = Math.floor(Math.random() * 100) + 1; //0-99 random number
					fileName = 'property-image-' + Date.now() + randomNumber + path.extname(pro_image.name);
					pro_image.mv(uploadPath + fileName, function(err) {
						if (err){
							return res.send(response.error(400, 'Image uploading failed', []));
						}
					});
					propertyImageNameArray.push('/public/images/property/' + fileName);
				});
			}
		}else{
			req.session.error = {errorMessage: 'File is required',inputData: req.body};
			return res.redirect('back');
		}
		
		if (req.body.wings_name) {
			let wings_name = req.body.wings_name;

			wings_name = Array.isArray(wings_name) ? wings_name : [wings_name];
			if (Array.isArray(wings_name)) {
				wings_name.forEach(wing => {
					wingsNameArray.push({'wings_name':wing});
				});
			}
		}else{
			req.session.error = {errorMessage: 'Wing name is required',inputData: req.body};
			return res.redirect('back');
		}
		
		const obj = new Property({
			property_name: req.body.property_name,
			address: req.body.address,
			propertyLatLong: [req.body.latitude,req.body.longitude],
            name_of_owner: req.body.name_of_owner,
            area_name:req.body.area_name,
			square_feet: req.body.square_feet,
			property_images:propertyImageNameArray,
			wings:wingsNameArray,
		});
		const propertyData = await obj.save();
		let propertiesData = await Property.find({});
		if(req.body.isCategory == true || req.body.isCategory == "true"){
			return res.redirect('/categories');			
		} else {
			return res.redirect('/ppm');
		}
		//return res.render('Admin/Properties/index',{'data':PropertyResource(propertiesData)});
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

// Property add form validatation
exports.propertyUpdateValidation = [
	check('property_name').trim().notEmpty().withMessage('Property name is required'),
	check('address').trim().notEmpty().withMessage('Address is required'),
	check('latitude').trim().notEmpty().withMessage('Latitude is required'),
	check('longitude').trim().notEmpty().withMessage('Longitude is required'),
];

// Property Update 
exports.propertyUpdate = async (req,res) => {
	try {
		res.locals = { title: 'Update Properties',session: req.session};

		const errors= validationResult(req);
        if(!errors.isEmpty()){
			let errMsg = errors.mapped();
			req.session.error = {errMsg: errMsg, inputData: req.body};
			return res.redirect('back');
		} else {
			req.session.error = '';
		}

		let propertyImageNameArray = [];
		let wingsNameArray = [];
		
		if (req.files && req.files.property_images) {
			let property_images = req.files.property_images;
			let uploadPath = __basedir + '/public/images/property/';

			property_images = Array.isArray(property_images) ? property_images : [property_images];

			if (Array.isArray(property_images)) {
				property_images.forEach(pro_image => {
					if (pro_image.mimetype !== "image/png" && pro_image.mimetype !== "image/jpg" && pro_image.mimetype !== "image/jpeg"){
						return res.send(response.error(400, 'File format should be PNG,JPG,JPEG', []));
					}
					if (pro_image.size >= (1024 * 1024 * 5)) { // if getter then 5MB
						return res.send(response.error(400, 'Image must be less then 5MB', []));
					}
				});
				property_images.forEach(pro_image => {
					let randomNumber = Math.floor(Math.random() * 100) + 1; //0-99 random number
					fileName = 'property-image-' + Date.now() + randomNumber + path.extname(pro_image.name);
					pro_image.mv(uploadPath + fileName, function(err) {
						if (err){
							return res.send(response.error(400, 'Image uploading failed', []));
						}
					});
					propertyImageNameArray.push('/public/images/property/' + fileName);
				});
			}
		}
		
		if (req.body.wings_name) {
			let wings_name = req.body.wings_name;

			wings_name = Array.isArray(wings_name) ? wings_name : [wings_name];
			if (Array.isArray(wings_name)) {
				wings_name.forEach(wing => {
					wingsNameArray.push({'wings_name':wing});
				});
			}
		}

		let oldPropertyData = await Property.findById(req.body._id)
		oldPropertyData.property_name=req.body.property_name; 
		oldPropertyData.address=req.body.address;
		oldPropertyData.location=req.body.location;
		oldPropertyData.propertyLatLong= [req.body.latitude,req.body.longitude];
		oldPropertyData.name_of_owner=req.body.name_of_owner;
		oldPropertyData.area_name=req.body.area_name;
		oldPropertyData.square_feet=req.body.square_feet;
		oldPropertyData.property_images= oldPropertyData.property_images.concat(propertyImageNameArray);
		oldPropertyData.wings=wingsNameArray;
		await oldPropertyData.save();

		return res.redirect('/properties');
		//return res.render('Admin/Properties/index',{'data':PropertyResource(propertyData)});

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

// Property List Page
exports.propertyList = async (req,res) => {
	try {
		let message = "Successfully logged in., You're in!";
		res.locals = { title: 'Properties',session: req.session};
		req.session.error = '';
		let page = 1;
		if(req.query.page != undefined){
			page = req.query.page;
		}
		let limit = { $limit : 10};
		let skip = { $skip : (page - 1) * 10};
		let project = {
			$project:{
				property_name:1,
				address:1,
				status:1
			}
		}

		let query1 = {};
		if(req.query.search){
			query1 = {$or:[]};
			query1["$or"].push({'property_name' : {$regex: new RegExp(req.query.search, 'i')}});
			query1["$or"].push({'address' : {$regex: new RegExp(req.query.search, 'i')}});
		}
		let search = {"$match": query1};
		let sort = {
            $sort:{
                createdAt:-1
            }
        };

		let totalProperty = await Property.count(query1);
		totalPage = Math.ceil(totalProperty/10);
		let propertyData = await Property.aggregate([search,sort,skip,limit,project]);
		return res.render('Admin/Properties/index',{'data':propertyData,page:page,totalPage:totalPage,message:message,search:req.query.search?req.query.search:""});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

exports.dashboardIndex = async (req,res) => {
	try {
		let message = "Successfully logged in., You're in!";
		res.locals = { title: 'Properties',session: req.session};
		req.session.error = '';
		let project = {
			$project:{
				property_name:1,
			}
		}
		let propertyData = await Property.aggregate([project]);

		// dymanic count 
		let dashboardCount = {};
		dashboardCount['usersCount'] = await User.count();
		dashboardCount['propertyCount'] = await Property.count();;
		dashboardCount['categoryCount'] = await Category.count();
		return res.render('Dashboard/index',{'data':propertyData,message:message,dashboardCount});
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

// Property Create Page
exports.propertyCreate = async (req,res) => {
	try {
		res.locals = { title: 'Create Property',session: req.session};
		res.locals.error = req.session.error ? req.session.error : '';

		let propertyData = await Property.find({});
		return res.render('Admin/Properties/create',{'data':PropertyResource(propertyData),req: req});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

// Property Update Page
exports.propertyEdit = async (req,res) => {
	try {
		res.locals = { title: 'Update Property',session: req.session};
		res.locals.error = req.session.error ? req.session.error : '';
		let propertyData = await Property.find({_id:req.params.id});
		let location = propertyData[0].propertyLatLong;
		return res.render('Admin/Properties/edit',{'data':PropertyResource(propertyData),'location':location,req: req});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

// Property View Page
exports.propertyView = async (req,res) => {
	try {
		res.locals = { title: 'View Property',session: req.session};
		let propertyData = await Property.find({_id:req.params.id});
		return res.render('Admin/Properties/view',{'data':PropertyResource(propertyData)});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}