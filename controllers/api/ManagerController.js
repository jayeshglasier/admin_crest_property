const User = require("../../models/User");
const Task = require("../../models/propertyTask");
const PPM = require("../../models/PPM");
const Category = require("../../models/Category");
const CategoryCheckList = require("../../models/CategoryCheckList");
const Property = require("../../models/Property");
const Form = require("../../models/Form");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const response = require("../../helper/response");
const SOP = require('../../models/SOP');
const RatingSetting = require("../../models/RatingSetting");
const {errorLog} = require("../../helper/consoleLog");
const Joi = require("joi");

exports.ppmTaskDetail = async (req, res) => {
	try {
		let schema = Joi.object({
			ppmId: Joi.string().min(24).max(24).required(),
			taskId: Joi.string().min(24).max(24).required(),
		});
		let validation = schema.validate(req.query, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let ppmTaskList = await PPM.findOne({_id:req.query.ppmId,status:1});
		if(!ppmTaskList){
			return res.send(response.error(400, 'PPM Not Found', []));
		}
		let index;
		for(let i=0;i<ppmTaskList.tasks.length;i++){
			if(String(ppmTaskList.tasks[i]._id) == String(req.query.taskId)){
				index = i;
			}
		}
		if(index == -1){
			return res.send(response.error(400, 'PPM Task Not Found', []));
		}
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    ppmTaskDetail: {
		    	_id:ppmTaskList._id,
		    	ppmName:ppmTaskList.ppmName,
		    	task:{
		    		taskName: ppmTaskList.tasks[index].taskName,
		    		vendorName: ppmTaskList.tasks[index].vendorName,
		    		frequency: ppmTaskList.tasks[index].frequency,
					day: ppmTaskList.tasks[index].day,
					date: ppmTaskList.tasks[index].date,
					month: ppmTaskList.tasks[index].month,
		    	},
		    }
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.ppmTaskList = async (req, res) => {
	try {
		let schema = Joi.object({
			ppmId: Joi.string().min(24).max(24).required()
		});
		let validation = schema.validate(req.query, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let condition = {"$match": {_id: ObjectId(req.query.ppmId),status:1}};
		let condition1 = {"$match": {"tasks.status":1}};
		let group = {
			$group:{
				_id:"$_id",
				ppmName:{$first:"$ppmName"},
				tasks:{
					$push:{
						taskName: "$tasks.taskName",
						frequency: "$tasks.frequency",
						day: "$tasks.day",
						date: "$tasks.date",
						vendorName: "$tasks.vendorName",
						month: "$tasks.month",
					}
				}
			}
		}
		let unwind = {
            $unwind: {
                path: "$tasks",
                preserveNullAndEmptyArrays: true
            }
        }
		let ppmTaskList = await PPM.aggregate([condition,unwind,condition1,group])
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    ppmTaskList: ppmTaskList
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.ppmList = async (req, res) => {
	try {
		let condition = {"$match": {status:1}};
		let project = {
			$project:{
				ppmName:"$ppmName"
			}
		}
		
		let ppmList = await PPM.aggregate([condition,project])
		
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    ppmList: ppmList
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.propertyDetail = async (req, res) => {
	try {
		let schema = Joi.object({
			propertyId: Joi.string().min(24).max(24).required()
		});
		let validation = schema.validate(req.body, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let property = await Property.findOne({_id:req.query.propertyId})
		if(!property){
			return res.send(response.error(400, 'Property Not Found', []));
		}
		let wings = [];
		for(let i=0;i<property.wings.length;i++){
			if(property.wings[i].status == 1){
				wings.push(property.wings[i].wings_name);
			}
		}
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    property: {
		    	property_name:property.property_name,
		    	name_of_owner:property.name_of_owner,
		    	square_feet:property.square_feet,
		    	area_name:property.area_name,
		    	property_images:property.property_images,
		    	address:property.address,
		    	wings:wings.join(","),
		    }
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.propertyWingList = async (req, res) => {
	try {
		let propertyIds = [];
		for(let i=0;i < req.user.property_id.length;i++){
			propertyIds.push(ObjectId(req.user.property_id[i]));
		}
		let condition = {"$match": {_id: {$in:propertyIds} , status:1}};
		//let condition = {"$match": {_id: ObjectId(req.query.propertyId) , status:1}};
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
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    wingsData: wingsData
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.propertyListWithRating = async (req, res) => {
	try {
		let propertyIds = [];
		for(let i=0;i < req.user.property_id.length;i++){
			propertyIds.push(ObjectId(req.user.property_id[i]));
		}
		let condition = {"$match": {_id: {$in:propertyIds}}};
		let project = {
			$project:{
				property_name:"$property_name",
				rating:{ $ifNull: [ "$rating", 0 ] }
			}
		}
		let propertyList = await Property.aggregate([condition,project]);
		let ratingSettingData = await RatingSetting.find({});
		for(let i=0;i<propertyList.length;i++){
			if(propertyList[i].rating != 0){
				let index = ratingSettingData.findIndex((x)=> propertyList[i].rating >= x.min_rating && propertyList[i].rating <= x.max_rating)
				if(index != -1){
					propertyList[i].rating = ratingSettingData[i].rating_name; 
				}else{
					propertyList[i].rating = "E";
				}
			}else{
				propertyList[i].rating = "Not Given";
			}
		}
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    propertyList:propertyList
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.assignTaskList = async (req, res) => {
	try {
		let propertyIds = [];
		for(let i=0;i < req.user.property_id.length;i++){
			propertyIds.push(ObjectId(req.user.property_id[i]));
		}
		let condition = {"$match": {propertyId: {$in:propertyIds}}};
		let project = {
			$project:{
				category_name:"$categories.category_name",
				createdAt:"$categories.createdAt"
			}
		}
		let lookup = {
        	$lookup: {
                from: 'categories',
                let: {
                    id: "$categoryId"
                },
                pipeline: [{
                        $match: {
                            $expr: {
                                $and: [{
                                        $eq: ["$_id", "$$id"]
                                    }/*,
                                    {
                                        $eq: [false, "$$isDeleted"]
                                    }*/
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            _id:1,
                            category_name: 1
                        }
                    }
                ],
                as: 'categories',
            }
        }

        let unwind = {
            $unwind: {
                path: "$categories",
                preserveNullAndEmptyArrays: true
            }
        }
		let taskData = await Task.aggregate([condition,lookup,unwind,project]);
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    taskData: taskData
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.categoryList = async (req, res) => {
	try {
		
		//let categoryData = await Category.find({status:1},{category_name:1});
		let propertyIds = [];
		for(let i=0;i < req.user.property_id.length;i++){
			propertyIds.push(ObjectId(req.user.property_id[i]));
		}
		let condition = {"$match": {propertyId: {$in:propertyIds}}};
		let project = {
			$project:{
				category_id:"$categories._id",
				category_name:"$categories.category_name",
				createdAt:"$categories.createdAt"
			}
		}
		let lookup = {
        	$lookup: {
                from: 'categories',
                let: {
                    id: "$categoryId"
                },
                pipeline: [{
                        $match: {
                            $expr: {
                                $and: [{
                                        $eq: ["$_id", "$$id"]
                                    }/*,
                                    {
                                        $eq: [false, "$$isDeleted"]
                                    }*/
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            _id:1,
                            category_name: 1
                        }
                    }
                ],
                as: 'categories',
            }
        }

        let unwind = {
            $unwind: {
                path: "$categories",
                preserveNullAndEmptyArrays: true
            }
        }
		let categoryData = await Task.aggregate([condition,lookup,unwind,project]);

		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    categoryData: categoryData
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.categoryCheckList = async (req, res) => {
	try {
		let schema = Joi.object({
			categoryId: Joi.string().min(24).max(24).required()
		});
		let validation = schema.validate(req.query, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let condition = {"$match": {category_id: ObjectId(req.query.categoryId),status:1}};
		let lookup = {
        	$lookup: {
                from: 'forms',
                let: {
                    id: "$_id"
                },
                pipeline: [{
                        $match: {
                            $expr: {
                                $and: [{
                                        $eq: ["$categoryChecklistId", "$$id"]
                                    },
                                    {
                                        $eq: [ObjectId(req.user._id), "$userId"]
                                    }
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            _id:1,
                            percentage: 1
                        }
                    }
                ],
                as: 'percentage',
            }
        }
        let unwind = {
            $unwind: {
                path: "$percentage",
                preserveNullAndEmptyArrays: true
            }
        }
        let project = {
			$project:{
				checklist_name:"$checklist_name",
				//percentage:{ $ifNull: [ "$percentage.percentage", 0 ] }
			}
		}
		let categoryChecklistData = await CategoryCheckList.aggregate([condition/*,lookup,unwind*/,project]);
		categoryChecklistData = JSON.parse(JSON.stringify(categoryChecklistData));
		for(let i=0;i<categoryChecklistData.length;i++){
			let form = await Form.findOne({categoryChecklistId:categoryChecklistData[i]._id,userId:req.user._id}).sort({createdAt:-1});
			if(form){
				categoryChecklistData[i].percentage = form.percentage;
			}else{
				categoryChecklistData[i].percentage = 0;
			}
		}

		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    categoryChecklistData: categoryChecklistData
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.supervisorList = async (req, res) => {
	try {
		let userData = await User.findOne({_id:req.user._id});
		let condition = {"$match": {property_id: {$in:userData.property_id},status:1,position_id:5}};
		let project = {
			$project : {
				"full_name" : "$full_name",
				"profile_image" : "$profile_image",
			}
		}
		let supervisorList = await User.aggregate([condition,project])
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    supervisorList: supervisorList
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.userDetail = async (req, res) => {
	try {
		let schema = Joi.object({
			userId: Joi.string().min(24).max(24).required()
		});
		let validation = schema.validate(req.query, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let userData = await User.findOne({_id:req.query.userId},{full_name:1,profile_image:1,mobile_no:1,email:1,property_id:1});
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
		let usedCategory = await Task.distinct( "categoryId", { managerId:req.query.userId });
		userData = JSON.parse(JSON.stringify(userData));
		let allCategory = [];
		if(usedCategory.length > 0){
			allCategory = await Category.find({_id: {$in: usedCategory},status:1},{category_name:1});
		}
		delete userData.property_id;
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    category: allCategory,
		    userData: userData,
		    wingsData:wingsData
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.getFormSubmitedDetail = async (req, res) => {
	try {
		let schema = Joi.object({
			formId: Joi.string().min(24).max(24).required()
		});
		let validation = schema.validate(req.query, __joiOptions);
		let formDetail = await Form.findOne({_id:req.query.formId})
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    formDetail: formDetail
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.formDetail = async (req, res) => {
	try {
		let schema = Joi.object({
			CategoryCheckListId: Joi.string().min(24).max(24).required()
		});
		let validation = schema.validate(req.query, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let formDetail = await CategoryCheckList.findOne({_id:req.query.CategoryCheckListId},{form:1});
		if (!formDetail) {
			return res.send(response.error(400, "Category Checklist not found", [] ));
		}
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    formDetail: formDetail
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.formSubmit = async (req, res) => {
	try {
		let schema = Joi.object({
			formId: Joi.string().min(24).max(24).optional(),
			categoryId: Joi.string().min(24).max(24).required(),
			categoryChecklistId: Joi.string().min(24).max(24).required(),
			userId: Joi.string().min(24).max(24).required(),
			form: Joi.optional(),
		});
		let validation = schema.validate(req.body, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let formDetail;
		if(req.body.formId){
			formDetail = await Form.findOne({_id:req.body.formId})
		}else{
			formDetail = new Form;
			formDetail.categoryId = req.body.categoryId;
			formDetail.categoryChecklistId = req.body.categoryChecklistId;
			formDetail.userId = req.body.userId;
		}
		formDetail.form = req.body.form;
		let percentage = 0;
		let array = ["button","paragraph","header"];
		let count = 0;
		let completeCount = 0;
		for(let i=0;i<req.body.form.length;i++){
			if(array.indexOf(req.body.form[i].type) == -1){
				count++;
				if(req.body.form[i].value && req.body.form[i].value.length > 0){d
					completeCount++;
				}
			}
		}
		formDetail.percentage = Math.ceil((completeCount * 100)/count);
		await formDetail.save()
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    formDetail: formDetail
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.assignSupervisor = async (req, res) => {
	try {
		let schema = Joi.object({
			categoryId: Joi.string().min(24).max(24).required(),
			propertyId: Joi.string().min(24).max(24).required(),
			superviserId: Joi.string().min(24).max(24).required()
		});
		let validation = schema.validate(req.body, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		for(let i=0;i<req.body.categoryId.length;i++){
			let alreadyTask = await Task.findOne({propertyId:req.body.propertyId,categoryId:req.body.categoryId[i]});
			if(!alreadyTask){
				alreadyTask = new Task; 
				alreadyTask.propertyId = req.body.propertyId;
				alreadyTask.categoryId = req.body.categoryId[i];
				alreadyTask.superviserId = [];
			}
			for(let j=0;j<req.body.superviserId.length;j++){
				let index = alreadyTask.superviserId.indexOf(ObjectId(req.body.superviserId[j]))
				if(index == -1){
					alreadyTask.superviserId.push(ObjectId(req.body.superviserId[j]));		
				}
			}
			await alreadyTask.save();
		}
		return res.send(response.success(200, 'Superviser Assign Successfully' ));
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

exports.historyList = async (req, res) => {
	try {
		let condition = {"$match": {userId: ObjectId(req.user._id)}};
		let group = {
			$group:{
				_id:"$categories._id",
				category_name: {$first:"$categories.category_name"},
				percentage: { $avg: "$percentage" }
			}
		}
		let lookup = {
        	$lookup: {
                from: 'categories',
                let: {
                    id: "$categoryId"
                },
                pipeline: [{
                        $match: {
                            $expr: {
                                $and: [{
                                        $eq: ["$_id", "$$id"]
                                    }/*,
                                    {
                                        $eq: [false, "$$isDeleted"]
                                    }*/
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            _id:1,
                            category_name: 1
                        }
                    }
                ],
                as: 'categories',
            }
        }

        let unwind = {
            $unwind: {
                path: "$categories",
                preserveNullAndEmptyArrays: true
            }
        }
        let start_date = null
        let end_date = null;
        let filter = {$match:{}}
        if(req.body.start_date){
        	start_date = new Date(req.body.start_date);
            //start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
        }
        if(req.body.end_date){
            end_date = new Date(req.body.end_date);
            //end_date = end_date.setHours(23, 59, 59, 999);
            end_date = new Date(end_date);
        }
        if(req.body.start_date && req.body.end_date){
        	filter = { "$match": { "createdAt": { $gte: start_date, $lt: end_date } } };
        }else if(req.body.start_date){
        	filter = { "$match": { "createdAt": { $lt: end_date } } };
        }else if(req.body.end_date){
        	filter = { "$match": { "createdAt": { $gte: start_date} } };
        }
		let history = await Form.aggregate([condition,filter,lookup,unwind,group]);
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    history:history
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.historyDetailList = async (req, res) => {
	try {
		let schema = Joi.object({
			categoryId: Joi.string().min(24).max(24).required()
		});
		let validation = schema.validate(req.query, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let condition = {"$match": {userId: ObjectId(req.user._id),categoryId: ObjectId(req.query.categoryId)}};
		let lookup = {
        	$lookup: {
                from: 'category_check_lists',
                let: {
                    id: "$categoryChecklistId"
                },
                pipeline: [{
                        $match: {
                            $expr: {
                                $and: [{
                                        $eq: ["$_id", "$$id"]
                                    }/*,
                                    {
                                        $eq: [false, "$$isDeleted"]
                                    }*/
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            _id:1,
                            checklist_name: 1,
                            type: 1
                        }
                    }
                ],
                as: 'category_check_lists',
            }
        }

        let unwind = {
            $unwind: {
                path: "$category_check_lists",
                preserveNullAndEmptyArrays: true
            }
        }
        let project = {
			$project:{
				_id:1,
				category_check_lists: 1,
				percentage: 1,
				status: 1
			}
		}
        let historyDetailList = await Form.aggregate([condition,lookup,unwind,project]);
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    historyDetailList:historyDetailList
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
exports.historyDetail = async (req, res) => {
	try {
		let schema = Joi.object({
			formId: Joi.string().min(24).max(24).required()
		});
		let validation = schema.validate(req.query, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let form = await Form.findOne({_id:req.query.formId});
		if(!form) {
			return res.send(response.error(400, "Form not found", [] ));
		}
		let category = await Category.findOne({_id:form.categoryId});
		if(!category) {
			return res.send(response.error(400, "Category not found", [] ));
		}
		let checkList = await CategoryCheckList.findOne({_id:form.categoryChecklistId});
		if(!checkList) {
			return res.send(response.error(400, "Category Checklist not found", [] ));
		}
		return res.status(200).send({
		    "status": true,
		    "status_code": "200",
		    historyDetail:{
		    	categoryName: category.category_name,
		    	checkListName: checkList.checklist_name,
		    	completeDate: form.completeDate,
		    	percentage: form.percentage,
		    	status: form.status,
		    	type: checkList.type,
		    }
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

exports.formList = async (req, res) => {
	try {
		// const startDate = new Date("2021-11-10")
		// const endDate = new Date("2021-11-20")

		const startDate = new Date(req.body.startDate)
		const endDate = new Date(req.body.endDate)

		const list = await Form.find({$and:[{createdAt:{$gte: startDate}},{endDate:{$lte: endDate}}]})
		if (!list) {
			return res.send(response.error(400, "FormList not found", [] ))
		}
		return res.status(200).send({
			"status": true,
			"status_code": "200",
			"formList": list
		});		
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}