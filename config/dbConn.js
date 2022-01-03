const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://kamalsherma:l2GIQc5mMOu0gtDo@cluster0.bpyxs.mongodb.net/crest_property_solutions?retryWrites=true&w=majority", {
	useNewUrlParser: true,
	useUnifiedTopology: true,
}).then(() => {
	console.log("connection is successful");
}).catch((e) => {
	console.log("connection not found");
})