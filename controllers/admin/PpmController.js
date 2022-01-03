const User = require("../../models/User");
const PPM = require("../../models/PPM");
const Property = require("../../models/Property");
const wingPPMS = require("../../models/wingPPMS");
const fs = require('fs')
const path = require('path');
const bcrypt = require("bcryptjs");
const response = require("../../helper/response");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const {errorLog} = require("../../helper/consoleLog");
const PropertyResource = require('../resources/PropertyResource');
const Joi = require("joi");


// PPM List Page 
exports.updatePpmStatus = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		let schema = Joi.object({
			ppmId: Joi.required()
		});
		let validation = schema.validate(req.body, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let ppmDetail = await PPM.findOne({_id:req.body.ppmId});
		if(ppmDetail.status == 0){
			ppmDetail.status = 1;
		}else{
			ppmDetail.status = 0;
		}
		ppmDetail.save();
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
exports.updatePpmName = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		let schema = Joi.object({
			ppmId: Joi.required(),
			ppmName: Joi.required()
		});
		let validation = schema.validate(req.body, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let ppmDetail = await PPM.findOne({_id:req.body.ppmId});
		if(!ppmDetail){
			return res.send(response.error(500, 'Something want wrong', []));
		}
		let alreadyPpmDetail = await PPM.findOne({_id:{$ne : req.body.ppmId},ppmName:req.body.ppmName.trim()});
		if(alreadyPpmDetail){
			return res.send(response.error(400, 'PPM name already exists', [] ));
		}
		ppmDetail.ppmName = req.body.ppmName.trim();
		ppmDetail.save();
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    "message": "Name updated successfully"
		});
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.updatePpmTaskStatus = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		let schema = Joi.object({
			ppmId: Joi.required(),
			taskId: Joi.required()
		});
		let validation = schema.validate(req.body, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let ppmDetail = await PPM.findOne({_id:req.body.ppmId});
		let index = ppmDetail.tasks.findIndex((x)=> String(x._id) == String(req.body.taskId));
		if(index == -1){
			return res.redirect('/edit-ppm/'+req.body.ppmId);
		}else{
			if(ppmDetail.tasks[index].status == 0){
				ppmDetail.tasks[index].status = 1;	
			}else{
				ppmDetail.tasks[index].status = 0
			}
			ppmDetail.markModified("tasks");
			ppmDetail.save();
		}
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    "message": "Status update"
		});
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.updatePropertyWingStatus = async (req,res) => {
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
		let propertyDetail = await Property.findOne({_id:req.body.propertyId,status:1});
		let index = propertyDetail.wings.findIndex((x)=> String(x._id) == String(req.body.wingId));
		if(index == -1){
			return res.redirect('/assign-ppm');
		}else{
			if(propertyDetail.wings[index].status == 0){
				propertyDetail.wings[index].status = 1;	
			}else{
				propertyDetail.wings[index].status = 0
			}
			propertyDetail.markModified("wings");
			propertyDetail.save();
		}
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    "message": "Status update"
		});
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

exports.createPpm = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		let schema = Joi.object({
			ppmName: Joi.required(),
			month: Joi.optional(),
			date: Joi.optional(),
			taskName: Joi.required(),
			vendorName: Joi.required(),
			frequency: Joi.required()
		});
		let validation = schema.validate(req.body, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let obj = new PPM({
			ppmName: req.body.ppmName,
			status: 1,
			tasks:[
			{
				taskName: req.body.taskName,
				vendorName: req.body.vendorName,
				frequency: req.body.frequency,
            	month: req.body.month,
            	date: req.body.date,
            	created_by: req.session.user._id,
            	updated_by: req.session.user._id,
				status: 1
			}]
		});
		let propertyData = await obj.save();
		return res.redirect('/ppm');
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

exports.PpmList = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		res.locals = { title: 'PPM',session: req.session};
		let page = 1;
		if(req.query.page != undefined){
			page = req.query.page;
		}
		let limit = { $limit : 10};
		let skip = { $skip : (page - 1) * 10};
		let project = {
			$project:{
				ppmName:1,
				status:1
			}
		}
		let query1 = {};
		if(req.query.search){
			query1 = {$or:[]};
			query1["$or"].push({'ppmName' : {$regex: new RegExp(req.query.search, 'i')}});
		}
		let search = {"$match": query1};
		let totalProperty = await PPM.count(query1);
		totalPage = Math.ceil(totalProperty/10);
		let sort = {
            $sort:{
                createdAt:-1
            }
        };
		let propertyData = await PPM.aggregate([search,sort,skip,limit,project]);
		let monthsList = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		return res.render('Admin/PPM/index',{'data':propertyData,months:monthsList,page:page,totalPage:totalPage,search:req.query.search?req.query.search:""});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.updatePpmTask = async (req,res) => {
	try {
		let schema = Joi.object({
			ppmId: Joi.required(),
			taskId: Joi.optional(),
			month: Joi.optional(),
			date: Joi.optional(),
			day: Joi.optional(),
			taskName: Joi.required(),
			vendorName: Joi.required(),
			frequency: Joi.required()
		});
		let validation = schema.validate(req.body, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let ppm = await PPM.findOne({_id:req.body.ppmId});
		if(!ppm){
			return res.redirect('/ppm');
		}
		let alreadyIndex = ppm.tasks.findIndex((x)=> String(x.taskName) == req.body.taskName && String(x._id) != req.body.taskId );
		if(alreadyIndex != -1){
			return res.redirect('/edit-ppm/'+req.body.ppmId+"?error=Task Name Already Exist");	
		}
		let message = "";
		let obj = {
			taskName: req.body.taskName,
			vendorName: req.body.vendorName,
			frequency: req.body.frequency,
			day: req.body.day?Number(req.body.day):null,
			month: req.body.month?Number(req.body.month):null,
			date: req.body.date?Number(req.body.date):null
		}
		if(req.body.taskId){
			let index = ppm.tasks.findIndex((x)=> String(x._id) == req.body.taskId);
			obj._id = req.body.taskId;
			ppm.tasks[index] = obj;
			message = "Task Added successfully";
		}else{
			ppm.tasks.push(obj);
			message = "Task Updated successfully";
		}
		ppm.markModified('tasks');
	
		ppm.save(function(err){
			
		});
		return res.redirect('/edit-ppm/'+req.body.ppmId+"?message="+message);	
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.editPpm = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		let schema = Joi.object({
			id: Joi.required()
		});
		let validation = schema.validate(req.params, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		res.locals = { title: 'Edit PPM',session: req.session};
		
		let page = 1;
		if(req.query.page != undefined){
			page = req.query.page;
		}
		let limit = { $limit : 10};
		let skip = { $skip : (page - 1) * 10};
		let project = {
			$project:{
				taskId:"$tasks._id",
				taskName:"$tasks.taskName",
				frequency:"$tasks.frequency",
				month:"$tasks.month",
				date:"$tasks.date",
				status:"$tasks.status",
				vendorName:"$tasks.vendorName"
			}
		}
		let aggregateQuery = {
            $match: {
                _id: require('mongoose').Types.ObjectId(req.params.id)
            }
        };
        let unwind = {
        	$unwind: "$tasks"
        }
        let group = {
                $group: {
                    _id: null,
                    ppmId: {$first : "$_id"},
                    status: {$first : "$status"},
                    ppmName: {$first : "$ppmName"},
                    total: { $sum: 1 }
                }
            };
		let ppmData = await PPM.aggregate([aggregateQuery,unwind,group]);
		if(ppmData.length == 0){
			return res.redirect('/ppm');
		}else{
			ppmData = ppmData[0];
		}
		let totalPage = Math.ceil(ppmData.total/10);
		let taskData = await PPM.aggregate([aggregateQuery,unwind,skip,limit,project]);
		return res.render('Admin/PPM/edit-ppm',{'data':ppmData,page:page,totalPage:totalPage,taskData:taskData,message:req.query.message,error:req.query.error,search:req.query.search?req.query.search:""});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

// View PPM List
exports.viewPpmList = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		res.locals = { title: 'View PPM List',session: req.session};

		let page = 1;
		if(req.query.page != undefined){
			page = req.query.page;
		}
		let limit = { $limit : 10};
		let skip = { $skip : (page - 1) * 10};
		let project = {
			$project:{
				property_name:1,
				status:1
			}
		}
		let sort = {
            $sort:{
                createdAt:-1
            }
        };
        let query1 = {};
		if(req.query.search){
			query1['property_name'] = {$regex: new RegExp(req.query.search, 'i')};
		}
        let search = {"$match": {
        				$and:[
        					{$or: [query1]},
        					{status:1}
        				]
        			}
        };
		let totalProperty = await Property.count(query1);
		totalPage = Math.ceil(totalProperty/10);
		let propertyData = await Property.aggregate([search,sort,skip,limit,project]);
		return res.render('Admin/PPM/view-ppm-list',{'data':propertyData,page:page,totalPage:totalPage,search:req.query.search?req.query.search:""});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

// Assign PPM List 
exports.addPropertyWing = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		for(let i=0;i< req.body.wings.length;i++){
			let wingPPm = await wingPPMS.create({
				wingId: req.body.wings[i],
				propertyId: req.body.propertyId,
				ppmIds: req.body.ppmIds
			})
		}
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    "message": "Property wing assign successfully"
		});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.editPropertyWing = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		let wingPPm = await wingPPMS.findOne({wingId:req.body.wingId})
		if(!wingPPm){
			wingPPm = await wingPPMS.create({
				wingId: req.body.wingId,
				propertyId: req.body.propertyId,
				ppmIds: req.body.ppmIds
			})
		}else{
			wingPPm.ppmIds = req.body.ppmIds;
			await wingPPm.save();
		}
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    "message": "Property wing assign updated successfully"
		});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.propertyWingList = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		let wingPpmList = await wingPPMS.find({propertyId:req.query.propertyId});
		let wingList = [];
		let wingsData = await Property.findOne({_id:req.query.propertyId,status:1},{wings:1,status:1});
		let ppmData = await PPM.find({},{ppmName:1});
		wingsData = JSON.parse(JSON.stringify(wingsData));
		for(let i=0;i< wingsData.wings.length;i++){
			if(wingsData.wings[i].status == 1){
				let index = wingPpmList.findIndex((x)=> String(x.wingId) == String(wingsData.wings[i]._id));
				if(index == -1){
					wingsData.wings[i].used = false;
				}else{
					wingsData.wings[i].used = true;
				}
				wingList.push(wingsData.wings[i])
			}
			
		}
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    "wings": wingList,
		    "ppm": ppmData
		});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.assignPpmList = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		res.locals = { title: 'Assign PPM List',session: req.session};
		let propertyData = await Property.find({status:1},{property_name:1}).sort({createdAt:-1});
		return res.render('Admin/PPM/assign-ppm-list',{'data':PropertyResource(propertyData)});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

// Property Wise PPM List
exports.propertiesWisePpmList = async (req,res) => {
	try {
		//if(!req.session.user){ return res.redirect('/login'); }
		if(!req.session.user){ return res.redirect('/login'); }
		let schema = Joi.object({
			id: Joi.required()
		});
		let validation = schema.validate(req.params, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		res.locals = { title: 'Assign PPM List',session: req.session};
		let winglist = await wingPPMS.find({propertyId:req.params.id});
		let ppmArray = [];
		for(let i =0;i<winglist.length;i++){
			for(let j =0;j<winglist[i].ppmIds.length;j++){
				ppmArray.push(winglist[i].ppmIds[j]);
			}
		}
		let page = 1;
		if(req.query.page != undefined){
			page = req.query.page;
		}
		let limit = { $limit : 10};
		let skip = { $skip : (page - 1) * 10};
		let project = {
			$project:{
				taskId:"$tasks._id",
				taskName:"$tasks.taskName",
				frequency:"$tasks.frequency",
				month:"$tasks.month",
				date:"$tasks.date",
				status:"$tasks.status",
				vendorName:"$tasks.vendorName"
			}
		}
		let aggregateQuery = {
            $match: {
                _id: {$in : ppmArray}
            }
        };
        let unwind = {
        	$unwind: "$tasks"
        }
        let group = {
                $group: {
                    _id: null,
                    ppmId: {$first : "$_id"},
                    status: {$first : "$status"},
                    ppmName: {$first : "$ppmName"},
                    total: { $sum: 1 }
                }
            };
        let sort = {
            $sort:{
                createdAt:-1
            }
        };
		let ppmData = await PPM.aggregate([aggregateQuery,unwind,group]);
		if(ppmData.length == 0){
			return res.redirect('/ppm');
		}else{
			ppmData = ppmData[0];
		}
		let totalPage = Math.ceil(ppmData.total/10);
		let taskData = await PPM.aggregate([aggregateQuery,unwind,sort,skip,limit,project]);
		return res.render('Admin/PPM/property-wise-ppm-list',{data:{propertyId:req.params.id},page:page,totalPage:totalPage,taskData:taskData,message:req.query.message,error:req.query.error,search:req.query.search?req.query.search:""});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

//  PPM Full Details
exports.ppmDetails = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		res.locals = { title: 'Assign PPM List',session: req.session};
		let propertyData = await PPM.find({});
		return res.render('Admin/PPM/ppm-details',{'data':PropertyResource(propertyData)});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

// Edit Wing Category
exports.editWingCategory = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		res.locals = { title: 'Assign PPM List',session: req.session};
		let propertyData = await Property.findOne({_id:req.params.pid,status:1});
		if(!propertyData){
			return res.redirect('/ppm');
		}
		let ppmList = await PPM.find({}); 
		let wingPpmList = await wingPPMS.findOne({propertyId:req.params.pid, wingId:req.params.id});
		
		let wingIndex = propertyData.wings.findIndex((x)=>String(x._id) == req.params.id);
		if(wingIndex == -1){
			return res.redirect('/ppm');
		}
		let ppmData = await PPM.find({},{ppmName: 1});
		ppmData = JSON.parse(JSON.stringify(ppmData));
		wingPpmList = JSON.parse(JSON.stringify(wingPpmList));
		for(let i=0;i< ppmData.length;i++){
			if(wingPpmList){
				let index = wingPpmList.ppmIds.indexOf(ppmData[i]._id);
				if(index == -1){
					ppmData[i].selected = false;
				}else{
					ppmData[i].selected = true;
				}
			}else{
				ppmData[i].selected = false;
			}
		}
		return res.render('Admin/PPM/edit-wing-category',{'ppmList':ppmData,wingId:req.params.id,propertyId:req.params.pid,wing:propertyData.wings[wingIndex]});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

// Edit PPM 
