const express = require("express");
const router = new express.Router();
const auth = require("../middleware/auth");
const AuthController = require("../controllers/api/AuthController");
const UserController = require("../controllers/api/UserController");
const PropertyController = require("../controllers/api/PropertyController");
const SopController = require('../controllers/api/SopController');
const ManagerController = require('../controllers/api/ManagerController');
const SupervisorController = require('../controllers/api/SupervisorController');
const CategoryController = require('../controllers/api/CategoryController');
const PpmController = require('../controllers/api/PpmController');
const HistoryController = require('../controllers/api/HistoryController');

router.post("/register", AuthController.registerValidation, AuthController.register); // user registration
router.post("/login", AuthController.login); // user login
router.post("/logout", auth, AuthController.logout); // user login
router.post("/forgot-password", AuthController.forgotPassword); // Forget Password to send mail
router.post("/change-password", auth, UserController.changePasswordValidation,UserController.changePassword); // change password

router.get("/profile-details", auth, UserController.userProfile); // get user details
router.post("/profile-update", auth, UserController.updateUser); // profile update
router.post("/profile-image-upload", auth, UserController.profileImageUpload); // profile image upload

router.get("/dashboard-slider-image", UserController.dashboardSliderImage); // user details

// users module
router.post("/add-users", auth, UserController.userAddValidation, UserController.addUsers); // supervisor and manager add
router.post("/supervisor-list", auth, UserController.supervisorList); // supervisor list
router.post("/manager-list", auth, UserController.managerList); // managers list
router.post("/user-detail", auth, UserController.userDetail); // user details
router.post("/user-status-active-inactive", auth, UserController.activeInactiveStatus); // user active - inactive

// Property
router.post("/property-list-with-rating", auth, PropertyController.propertyList); // property list
router.post("/property-detail", auth, PropertyController.propertyDetail);
router.post("/property-wings-list", auth, PropertyController.propertyWingList);

// SOP
router.post("/sop-category-list", auth, SopController.sopCategoryList); // property list
router.post("/sop-category-detail", auth, SopController.categorySOPDetail);

router.post("/category-list", auth, CategoryController.categoryList);
router.post("/category-wise-check-list", auth, CategoryController.categoryCheckList);
router.post("/form-detail", auth, CategoryController.formDetail);
router.post("/form-submit", auth, CategoryController.formSubmit);
router.post("/form-submit-detail", auth, CategoryController.getFormSubmitedDetail);
router.post("/form-list", auth, CategoryController.formList);

// PPM Module
router.post("/ppm-task-list", auth, PpmController.ppmTaskList);
router.post("/ppm-list", auth, PpmController.ppmList);
router.post('/properties-wise-view-ppm', auth, PpmController.propertiesWisePpmList);
router.post("/edit-ppm-name", auth, PpmController.editPpmName);
router.post("/add-new-ppm", auth, PpmController.createNewPPM);
//router.post("/edit-ppm-task", auth, PpmController.editPpmTask);
router.post("/ppm-task-detail", auth, PpmController.ppmTaskDetail);
router.post("/update-ppm-task", auth, PpmController.updatePpmTask);
router.post("/ppm-status-active-inactive", auth, PpmController.activeInactiveStatus); // Active - inactive

// History
router.post("/history-list", auth, HistoryController.historyList);
router.post("/history-detail-list", auth, HistoryController.historyDetailList);
router.post("/history-detail", auth, HistoryController.historyDetail);

//manager Controller

router.post("/manager/update", auth, AuthController.update); // user login
router.get("/manager/assign-task-list", auth, ManagerController.assignTaskList);
router.post("/manager/assign-supervisor", auth, ManagerController.assignSupervisor);
router.get("/manager/property-list-with-rating", auth, ManagerController.propertyListWithRating);

// supervisor
router.post("/supervisor/update", auth, AuthController.update); // user login
router.get("/supervisor/assign-task-list", auth, SupervisorController.assignTaskList);
router.get("/supervisor/property-list-with-rating", auth, SupervisorController.propertyListWithRating);
module.exports = router;