const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {errorLog} = require("../helper/consoleLog");
const Joi = require("joi");

const wingsSchema = new mongoose.Schema({ 
	wings_name: {
		type: String,
		trim: true,
	},
	status: {
		type: Number, //0=Inactive, 1=active
		min: [0,'invalid status'],
    	max: [1,'invalid status'],
		default: 1,
	},
});

const propertySchema = new mongoose.Schema({
	property_name: {
		type: String,
		required:true,
		trim: true,
		unique: true
	},
	address: {
		type: String,
		required:true,
		trim: true,
	},
	propertyLatLong: {
        type: [Number],
        required:true,
        index: '2d'
    },
	property_images: {
		type: [String],
		trim: true,
	},
	name_of_owner: {
		type: String,
		trim: true,
	},
	area_name: {
		type: String,
		trim: true,
	},
	square_feet: {
		type: String,
		trim: true,
	},
	rating: {
		type: Number,
		default:0
	},
	wings:[wingsSchema],

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

const Property = new mongoose.model("Property", propertySchema);
module.exports = Property;