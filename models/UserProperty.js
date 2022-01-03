const mongoose = require("mongoose");

const UserPropertySchema = new mongoose.Schema({
	userId: {
		type:  mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
		trim: true
	},
	propertyId: {
		type:  mongoose.Schema.Types.ObjectId,
		ref: 'Property',
		required: true,
		trim: true
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

const UserProperty = new mongoose.model("User_Property", UserPropertySchema);
module.exports = UserProperty;