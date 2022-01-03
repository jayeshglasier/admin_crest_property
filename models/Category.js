const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
	category_name: {
		type: String,
		required:true,
		trim: true,
		unique: true
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

const Category = new mongoose.model("Category", categorySchema);
module.exports = Category;