const PPM = require("../../models/PPM");
const wingPPMS = require("../../models/wingPPMS");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const response = require("../../helper/response");
const {errorLog} = require("../../helper/consoleLog");
const Joi = require("joi");

exports.ppmTaskDetail = async (req, res) => {
	try {
		let schema = Joi.object({
			ppmId: Joi.string().min(24).max(24).required(),
			taskId: Joi.string().min(24).max(24).required(),
		});
		let validation = schema.validate(req.body, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let ppmTaskList = await PPM.findOne({_id:req.body.ppmId,status:1});
		if(!ppmTaskList){
			return res.send(response.error(400, 'PPM Not Found', []));
		}
		let index;
		for(let i=0;i<ppmTaskList.tasks.length;i++){
			if(String(ppmTaskList.tasks[i]._id) == String(req.body.taskId)){
				index = i;
			}
		}
		if(index == -1){
			return res.send(response.error(400, 'PPM Task Not Found', []));
		}
		return res.status(200).send({
		    "status": true,
            "status_code": "200",
            "message": "PPM task details",
		    data: [{
		    	_id:ppmTaskList._id,
		    	ppmName:ppmTaskList.ppmName,
		    	task:[{
		    		taskName: ppmTaskList.tasks[index].taskName,
		    		vendorName: ppmTaskList.tasks[index].vendorName,
		    		frequency: ppmTaskList.tasks[index].frequency,
					day: ppmTaskList.tasks[index].day,
					date: ppmTaskList.tasks[index].date,
					month: ppmTaskList.tasks[index].month,
		    	}],
		    }]
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
		let validation = schema.validate(req.body, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let condition = {"$match": {_id: ObjectId(req.body.ppmId),status:1}};
		let condition1 = {"$match": {"tasks.status":1}};
		let group = {
			$group:{
				_id:"$_id",
				ppmName:{$first:"$ppmName"},
				tasks:{
					$push:{
                        _id:"$tasks._id",
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
            "message": "PPM task list",
		    data: ppmTaskList
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
				ppmName:"$ppmName",
				status:"$status"
			}
		}
		
		let ppmList = await PPM.aggregate([project])
		
		return res.status(200).send({
		    "status": true,
            "status_code": "200",
            "message": "PPM List",
		    data: ppmList
		});
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

// Property Wise PPM List
exports.propertiesWisePpmList = async (req,res) => {
	try {
		let schema = Joi.object({
			projectId:Joi.string().min(24).max(24).required(),
		});
		let validation = schema.validate(req.body, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		let winglist = await wingPPMS.find({propertyId:req.body.projectId});
		let ppmArray = [];
		for(let i =0;i<winglist.length;i++){
			for(let j =0;j<winglist[i].ppmIds.length;j++){
				ppmArray.push(winglist[i].ppmIds[j]);
			}
		}
		let project = {
			$project:{
				_id:{_id:1},
				ppmName:{ppmName:1}
			}
		}
       
		let ppmData = await PPM.aggregate([project]);
		return res.status(200).send({
		    "status": true,
            "status_code": "200",
            "message": "Property wise ppm list",
		    data: ppmData
		});

	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

exports.editPpmName = async (req, res) => {
	try {
		let schema = Joi.object({
			ppmId: Joi.string().min(24).max(24).required(),
			ppm_name: Joi.string().required()
		});
		let validation = schema.validate(req.body, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}

		const exists = await PPM.findOne({ ppmName: req.body.ppm_name });
		if(exists) {
			return res.send(response.error(400, 'PPM name already exists', [] ));
		}
		if(req.body.ppmId){
			const updateData = await PPM.findByIdAndUpdate(req.body.ppmId, {ppmName: req.body.ppm_name}, {new: true, runValidators: true});
		}
		return res.send(response.success(200, 'PPM name updated', []));
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

exports.activeInactiveStatus = async (req, res) => {
	try {
		let schema = Joi.object({
			ppmId: Joi.string().min(24).max(24).required(),
			status: Joi.string().min(1).max(1).required() // 0 = Inactive & 1 = Active
		});
		let validation = schema.validate(req.body, __joiOptions);
		if (validation.error) {
			return res.send(response.error(400, validation.error.details[0].message, [] ));
		}
		if(req.body.ppmId){
			const updateData = await PPM.findByIdAndUpdate(req.body.ppmId, {status: req.body.status}, {new: true, runValidators: true});
		}
		return res.send(response.success(200, 'Status changes successfully', []));
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

exports.createNewPPM = async (req,res) => {
	try {
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

		const exists = await PPM.findOne({ ppmName: req.body.ppmName });
		if(exists) {
			return res.send(response.error(400, 'PPM name already exists', [] ));
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
            	created_by: req.user._id,
            	updated_by: req.user._id,
				status: 1
			}]
		});
		let propertyData = await obj.save();
		return res.send(response.success(200, 'PPM task added', []));
	} catch (error) {
		console.log(error);
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

// Update PPM Task
exports.updatePpmTask = async (req,res) => {
	try {
		let schema = Joi.object({
			ppmId: Joi.required(),
			taskId: Joi.required(),
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
			return res.send(response.error(500, 'ppmId not valid', []));
		}
		let alreadyIndex = ppm.tasks.findIndex((x)=> String(x.taskName) == req.body.taskName && String(x._id) != req.body.taskId );
		if(alreadyIndex != -1){
			return res.send(response.error(500, 'Task name already exist', []));
		}
		let message = "";
		let obj = {
			taskName: req.body.taskName,
			vendorName: req.body.vendorName,
			frequency: req.body.frequency,
			day: req.body.day,
			month: req.body.month,
			date: req.body.date
		}
		if(req.body.taskId){
			let index = ppm.tasks.findIndex((x)=> String(x._id) == req.body.taskId);
			obj._id = req.body.taskId;
			ppm.tasks[index] = obj;
			message = "Task updated successfully";
		}else{
			ppm.tasks.push(obj);
			message = "Task added successfully";
		}
		ppm.markModified('tasks');
		console.log(obj);
		ppm.save(function(err){
			console.log(err);
		});
		return res.send(response.success(200, message, []));
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

