const mongoose = require("mongoose");

const wingPPMSchema = new mongoose.Schema({
	wingId: {
		type: mongoose.Schema.Types.ObjectId,
		required:true,
		unique: true
	},
	propertyId: {
		type: mongoose.Schema.Types.ObjectId,
		required:true
	},
	ppmIds: {
		type: [mongoose.Schema.Types.ObjectId],
		default:[],
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

const wingPPMS = new mongoose.model("wingPPM", wingPPMSchema);
module.exports = wingPPMS;