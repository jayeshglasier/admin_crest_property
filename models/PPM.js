const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({ 
	taskName: {
		type: String,
		required:true,
		trim: true,
	},
	vendorName: {
		type: String,
		required:true,
		trim: true,
	},
	frequency: {
		type: String,
		enum:['daily','monthly','quarterly','annually','bi-annually','weekly'],
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
	status: {
		type: Number, //0=Inactive, 1=active
		min: [0,'invalid status'],
    	max: [1,'invalid status'],
		default: 1,
	},
	day: {
		type: String,
		enum: ['','monday','tuesday','wednesday','thursday','friday','saturday','sunday'],
		trim: true,
	},
	created_by: {
		type: mongoose.Schema.Types.ObjectId, ref: 'User'
	},
	updated_by: {
		type: mongoose.Schema.Types.ObjectId, ref: 'User'
	},
	created_at: {
		type: Date,
		default: Date.now,
	},
	updated_at: {
		type: Date,
		default: Date.now,
	}
});

const ppmSchema = new mongoose.Schema({
	ppmName: {
		type: String,
		required:true,
		trim: true,
		unique: true
	},
	tasks: [taskSchema],

	status: {
		type: Number, //0=Inactive, 1=active
		min: [0,'invalid status'],
    	max: [1,'invalid status'],
		default: 1,
	},
	created_by: {
		// type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true
		type: mongoose.Schema.Types.ObjectId, ref: 'User'
	},
	updated_by: {
		type: mongoose.Schema.Types.ObjectId, ref: 'User'
	},
},{
	timestamps: true,
	versionKey: false
});

const PPM = new mongoose.model("ppm", ppmSchema);
module.exports = PPM;