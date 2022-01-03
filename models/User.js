const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {errorLog} = require("../helper/consoleLog");
const Joi = require("joi");

const userSchema = new mongoose.Schema({
	email: {
		type: String,
		trim: true,
		unique: true,
		required:true,
		validate(value){
			if (!validator.isEmail(value)) {
				throw new Error("Invalid Email")
			}
		}
	},
	password: {
		type: String,
		trim: true,
	},
	full_name: {
		type: String,
		required:true,
		trim: true,
	},
	mobile_no: {
		type: String,
		trim: true,
	},
	address: {
		type: String,
		trim: true,
	},
	position_id: {
		type: Number, // 1=Admin, 2=Operation Team, 3=Auditor 4=Manager 5=Supervisor.
		min: [1,'invalid user type'],
    	max: [8,'invalid user type'],
		trim: true,
	},
	position_type: {
		type: String,
		trim: true,
	},
	property_id: {
		type: [mongoose.Schema.Types.ObjectId],
		default:[],
		trim: true,
	},
	gender: {
		type: String,
		trim: true,
	},
	profile_image: {
		type: String,
		trim: true,
	},
	tokens: [{type: Object}], //store jwt tokens array
	device_token: {
		type: String,
		trim: true,
	},
	device_type: {
		type: Number, // 1=web, 2=ios, 3=android
		min: [1,'invalid device type'],
    	max: [3,'invalid device type']
	},
	email_verified_status: {
		type: Number, // 1=Verified, 0=Pending
		min: [0,'invalid status'],
    	max: [1,'invalid status'],
		default: 0,
	},
	registration_status: {
		type: Number, // 1=Success, 0=Pending
		min: [0,'invalid status'],
    	max: [1,'invalid status'],
		default: 0,
	},
	reset_password_status: {
		type: Number, //0=Inactive, 1=active
		min: [0,'invalid status'],
    	max: [1,'invalid status'],
		default: 0,
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

userSchema.statics.userValidate = function (userData) {
	const schema = Joi.object({
		name: Joi.string().allow('',null).trim(true), //.messages({'any.required': `name is a required field`}),
		gender: Joi.number().allow('',null),
	});
	const validation = schema.validate(userData, __joiOptions)
	return validation;
}

// generating tokens
userSchema.methods.generatingAuthToken = async function (req,res) {
	try {
		const token = jwt.sign({_id: this._id}, process.env.SECRET_KEY, {algorithm: 'HS384'} );
		return token;
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', [] ));
	}
}

// convert password into hash
userSchema.pre("save", async function(next) {
	if (this.isModified("password")) {
		this.password = await bcrypt.hash(this.password, 10);
	}	
	next();
});

// password hashing when updating password
userSchema.pre("findOneAndUpdate", async function(next) {
	try {
		const password = this.getUpdate().password;
		if (password) {
			const hashPassword = await bcrypt.hash(password, 10);
			this.getUpdate().password = hashPassword;
		}
		next();
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return next(error);
	}
});

const User = new mongoose.model("User", userSchema);
module.exports = User;