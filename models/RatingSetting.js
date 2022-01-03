const mongoose = require("mongoose");

const RatingSettingSchema = new mongoose.Schema({
	rating_name: {
		type: String,
		required:true,
		trim: true,
		required: true
	},
	min_rating: {
		type: Number,
		trim: true,
		required: true
	},
	max_rating: {
		type: Number,
		trim: true,
		required: true
	}
},{
	timestamps: true,
	versionKey: false
});

const RatingSetting = new mongoose.model("Rating_Setting", RatingSettingSchema);
module.exports = RatingSetting;