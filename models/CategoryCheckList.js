const mongoose = require("mongoose");

const categoryCheckListSchema = new mongoose.Schema({
	category_id: {
		type:  mongoose.Schema.Types.ObjectId,
		ref: 'Category',
		required:true,
		trim: true,
	},
    checklist_id: {
		type: String,
		required:true,
		trim: true,
	},
    checklist_name: {
		type: String,
		required:true,
		trim: true,
	},
    type: {
		type: String,
		enum: ['form','register','check_list'],
		required:true,
		trim: true,
	},
	form: {
		type: Array,
		defult: [],
	},
	frequency: {
		type: String,
		enum: ['daily','monthly','quarterly','annually','bi-annually','weekly'],
		required:true,
		trim: true,
	},
	month: {
		type: Number,
		min: [1,'invalid status'],
    	max: [12,'invalid status'],
		trim: true,
	},
	date: {
		type: Number,
		min: [1,'invalid status'],
    	max: [31,'invalid status'],
		trim: true,
	},
	day: {
		type: String,
		enum: ['','monday','tuesday','wednesday','thursday','friday','saturday','sunday'],
		trim: true,
	},

	status: {
		type: Number, //0=Inactive, 1=active
		min: [0,'invalid status'],
    	max: [1,'invalid status'],
		default: 1,
	}
},{
	timestamps: true,
	versionKey: false
});

const CategoryCheckList = new mongoose.model("category_check_list", categoryCheckListSchema);
module.exports = CategoryCheckList;