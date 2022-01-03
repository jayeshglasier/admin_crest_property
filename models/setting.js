const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
	uniqueId: {
		type: Number
	},

},{
	timestamps: true,
	versionKey: false
});

const setting = new mongoose.model("setting", settingSchema);
module.exports = setting;