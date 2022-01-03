const RatingSetting = require("../../models/RatingSetting");
const response = require("../../helper/response");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const {errorLog} = require("../../helper/consoleLog");


// Setting Page
exports.settingList = async (req,res) => {
	try {
		res.locals = { title: 'Manage Rating', session: req.session};
		let RatingSettingData = await RatingSetting.find({});

		return res.render('Admin/Setting/index',{ data: RatingSettingData });
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}

// Store Rating Setting
exports.storeSetting = async (req,res) => {
	try {
		res.locals = { title: 'Manage Rating', session: req.session};

		await RatingSetting.deleteMany();

		for (let i = 0; i < req.body.rating_name.length; i++) {
			await RatingSetting.create({
				rating_name: req.body.rating_name[i],
				min_rating: parseFloat(req.body.min_rating[i]).toFixed(2),
				max_rating: parseFloat(req.body.max_rating[i]).toFixed(2),
			});
		}

		return res.redirect('/setting');
	} catch (error) {
		errorLog(__filename, req.originalUrl, error);
		return res.send(response.error(500, 'Something want wrong', []));
	}
}