const mongoose = require("mongoose");

const formSchema = new mongoose.Schema({

	categoryChecklistId: {
		type:  mongoose.Schema.Types.ObjectId,
		required:true,
		trim: true,
	},
	categoryId: {
		type:  mongoose.Schema.Types.ObjectId,
		required:true,
		trim: true,
	},
	userId: {
		type:  mongoose.Schema.Types.ObjectId,
		required:true,
		trim: true,
	},
	status: {
		type: Number, //0=Inactive, 1=Active
		min: [0,'invalid status'],
    	max: [1,'invalid status'],
		default: 0,
	},
	completeDate: {
		type: Date,
		defult: null,
	},
	form: {
		type: Array,
		defult: [],
	},
	percentage:{
		type: Number,
		default:0
	}
},{
	timestamps: true,
	versionKey: false
});

const Form = new mongoose.model("form", formSchema);
module.exports = Form;