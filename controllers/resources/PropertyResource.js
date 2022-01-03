
const PropertyResource = (res) => {
	Array.isArray(res) ? res : res=[res];
	let ResponseArray = [];

	for (const resData of res) {
		if (resData.property_name) {
			ResponseArray.push({
				"_id": resData._id ? resData._id : "",
				"property_name": resData.property_name ? resData.property_name : "",
				"address": resData.address ? resData.address : "",
				"location": resData.location ? resData.location : "",
				"name_of_owner": resData.name_of_owner ? resData.name_of_owner : "",
				"area_name": resData.area_name ? resData.area_name : "",
				"square_feet": resData.square_feet ? resData.square_feet : "",
				"status": resData.status ? resData.status : "",
				"property_images": resData.property_images ? resData.property_images : "",
				"wings": resData.wings ? resData.wings : "",
				
			});
		} else {
			ResponseArray.push({
				"_id": resData._id ? resData._id : "",
				"property_name": resData.property_name ? resData.property_name : "",
				"address": resData.address ? resData.address : "",
				"location": resData.location ? resData.location : "",
				"name_of_owner": resData.name_of_owner ? resData.name_of_owner : "",
				"area_name": resData.area_name ? resData.area_name : "",
				"square_feet": resData.square_feet ? resData.square_feet : "",
				"status": resData.status ? resData.status : "",
				"property_images": resData.property_images ? resData.property_images : "",
				"wings": resData.wings ? resData.wings : "",
			});
		}
	}
	return ResponseArray;
}
module.exports = PropertyResource;