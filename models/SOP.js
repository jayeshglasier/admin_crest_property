const mongoose = require("mongoose");

const SubCategorySchema = new mongoose.Schema({ 
	sub_category_name: {
		type: String,
		trim: true
	},
	sub_category_files: {
		type: [String],
		trim: true
	}, 
});

const SOPSchema = new mongoose.Schema({
	category_name: {
		type: String,
		required:true,
		trim: true,
		required: true
	},
	level: {
		type: Number,
		trim: true,
		required: true
	},
	single_category_files: {
		type: [String],
		trim: true
	},
	sub_category: [SubCategorySchema],

	status: {
		type: Number, //0=Inactive, 1=Active
		min: [0,'invalid status'],
    	max: [1,'invalid status'],
		default: 1,
	},
	created_by: {
		type: mongoose.Schema.Types.ObjectId, ref: 'User'
	},
	updated_by: {
		type: mongoose.Schema.Types.ObjectId, ref: 'User'
	}
},{
	timestamps: true,
	versionKey: false
});

const SOP = new mongoose.model("sop", SOPSchema);
module.exports = SOP;