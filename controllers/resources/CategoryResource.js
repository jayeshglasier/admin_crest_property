
const PropertyResource = (res) => {
	Array.isArray(res) ? res : res=[res];
	let ResponseArray = [];

	for (const resData of res) {
		if (resData.category_name) {
			ResponseArray.push({
				"_id": resData._id ? resData._id : "",
				"category_name": resData.category_name ? resData.category_name : "",
				"status": resData.status ? resData.status : "",
			});
		} else {
			ResponseArray.push({
				"_id": resData._id ? resData._id : "",
				"category_name": resData.category_name ? resData.category_name : "",
				"status": resData.status ? resData.status : "",
			});
		}
	}
	return ResponseArray;
}
module.exports = PropertyResource;