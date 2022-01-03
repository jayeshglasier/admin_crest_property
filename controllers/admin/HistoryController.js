const User = require("../../models/User");
const Property = require("../../models/Property");
const fs = require('fs')
const path = require('path');
const bcrypt = require("bcryptjs");
const response = require("../../helper/response");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const {errorLog} = require("../../helper/consoleLog");
const PropertyResource = require('../resources/PropertyResource');
const Joi = require("joi");

// History List Page
exports.historyList = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		res.locals = { title: 'History List', session: req.session};
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
			//query1["$or"].push({'address' : {$regex: new RegExp(req.query.search, 'i')}});
		}
		let search = {"$match": query1};

		let totalProperty = await Property.count(query1);
		totalPage = Math.ceil(totalProperty/10);
		let propertyData = await Property.aggregate([search,skip,limit,project]);
		return res.render('Admin/History/index',{'data':propertyData,page:page,totalPage:totalPage,search:req.query.search?req.query.search:""});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

// Category History Page
exports.categoryHistory = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		res.locals = { title: 'Category History List', session: req.session};
		let propertyData = await Property.find({});
		return res.render('Admin/History/category-history',{'data':PropertyResource(propertyData)});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

// Category Checklist History Page
exports.categoryChecklistHistory = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		res.locals = { title: 'Category Checklist History List', session: req.session};
		let propertyData = await Property.find({});
		return res.render('Admin/History/category-checklist-history',{'data':PropertyResource(propertyData)});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

// View Checklist History Page
exports.viewChecklistHistory = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		res.locals = { title: 'View Checklist List', session: req.session};
		let propertyData = await Property.find({});
		return res.render('Admin/History/view-checklist-history',{'data':PropertyResource(propertyData)});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}