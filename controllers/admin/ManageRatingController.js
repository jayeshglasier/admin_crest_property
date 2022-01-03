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

// Manage Rating List Page
exports.manageRatingList = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		res.locals = { title: 'Manage Rating',session: req.session};
		let propertyData = await Property.find({});
		return res.render('Admin/Manage-Rating/index',{'data':PropertyResource(propertyData)});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

exports.assignAuditor = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		res.locals = { title: 'Assign Auditor - Manage Rating',session: req.session};
		let propertyData = await Property.find({});
		return res.render('Admin/Manage-Rating/assign-auditor',{'data':PropertyResource(propertyData)});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

exports.groupList = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		res.locals = { title: 'Manage Rating',session: req.session};
		let propertyData = await Property.find({});
		return res.render('Admin/Manage-Rating/group-list',{'data':PropertyResource(propertyData)});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

exports.editGroup = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		res.locals = { title: 'Edit Group',session: req.session};
		let propertyData = await Property.find({});
		return res.render('Admin/Manage-Rating/edit-group',{'data':PropertyResource(propertyData)});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

exports.editGroupName = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		res.locals = { title: 'Edit Group',session: req.session};
		let propertyData = await Property.find({});
		return res.render('Admin/Manage-Rating/edit-group-name',{'data':PropertyResource(propertyData)});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

exports.editTopic = async (req,res) => {
	try {
		if(!req.session.user){ return res.redirect('/login'); }
		res.locals = { title: 'Edit Group',session: req.session};
		let propertyData = await Property.find({});
		return res.render('Admin/Manage-Rating/edit-topic',{'data':PropertyResource(propertyData)});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}