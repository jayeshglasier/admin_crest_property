const Category = require("../../models/Category");
const CategoryCheckList = require("../../models/CategoryCheckList");
const Form = require("../../models/Form");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const response = require("../../helper/response");
const {errorLog} = require("../../helper/consoleLog");
const Joi = require("joi");

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
            "message": "History list",
		    data:history
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
		let validation = schema.validate(req.body, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let condition = {"$match": {userId: ObjectId(req.user._id),categoryId: ObjectId(req.body.categoryId)}};
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
            "message": "History details list",
		    data:historyDetailList
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
		let validation = schema.validate(req.body, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let form = await Form.findOne({_id:req.body.formId});
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
            "message": "History details",
		    data:{
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