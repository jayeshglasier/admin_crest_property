const SOP = require("../../models/SOP");
const response = require("../../helper/response");
const mongoose = require("mongoose");
const {errorLog} = require("../../helper/consoleLog");
const console = require("../../helper/console");
const Joi = require("joi");

exports.sopCategoryList = async (req,res) => {
	try {
		let sopList = await SOP.find({status:1},{category_name:1,level:1})
		return res.status(200).send({
		    "status": true,
			"status_code": "200",
			"message": "Sop list",
		    data: sopList
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

exports.categorySOPDetail = async (req, res) => {
	try {
		let schema = Joi.object({
			sopId: Joi.string().min(24).max(24).required()
		});
		let validation = schema.validate(req.body, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}

		let sopDetail = await SOP.findOne({_id:req.body.sopId},{category_name:1,level:1,single_category_files:1,sub_category:1})
		if(!sopDetail){
			return res.send(response.error(400, 'SOP Not Found', []));
		}
		return res.status(200).send({
		    "status": true,
			"status_code": "200",
			"message": "Sop details",
			"level": sopDetail.level,
		    prePath: process.env.PUBLIC_URL+"/public/images/sop_files/",
		    data: [sopDetail]
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}
