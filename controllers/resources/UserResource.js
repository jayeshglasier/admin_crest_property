const {getAge} = require('../../helper/commonHelpers');

const UserResource = (res) => {
	Array.isArray(res) ? res : res=[res];
	let ResponseArray = [];
	
	for (const resData of res) {
		ResponseArray.push(
			{
				"_id": resData._id ? resData._id : "",
				"full_name": resData.full_name ? resData.full_name : "",
				"email": resData.email ? resData.email : "",
				"mobile_no": resData.mobile_no ? resData.mobile_no : "",
				"address": resData.address ? resData.address : "",
				"position_id": resData.position_id ? resData.position_id.toString() : "",
				"position_type": resData.position_type ? resData.position_type.toString() : "",
				"profile_image": resData.profile_image ? resData.profile_image : "",
				"reg_status": resData.registration_status ? resData.registration_status.toString() : "0",
				"reg_date": resData.created_at ? resData.created_at.toString() : "0",
				"status": resData.status ? resData.status.toString() : "",
				"token": resData.token,
			}
		);
	}
	return ResponseArray;
}

module.exports = UserResource;