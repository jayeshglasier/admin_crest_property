const validator = require('express-validator');
const AuthController = require('../controllers/admin/AuthController');
const PropertyController = require("../controllers/admin/PropertyController");
const UserController = require("../controllers/admin/UserController");
const ManageRatingController = require("../controllers/admin/ManageRatingController");
const PpmController = require("../controllers/admin/PpmController");
const TaskController = require("../controllers/admin/TaskController");
const SopController = require("../controllers/admin/SopController");
const HistoryController = require("../controllers/admin/HistoryController");
const CategoriesController = require("../controllers/admin/CategoriesController");
const SettingController = require("../controllers/admin/SettingController");

module.exports = function (app) {

    function isUserAllowed(req, res, next) {
        if (req.session.user) {
            return next();
        }
        else { res.redirect('/login'); }
    }

    app.get('/page-not-found', UserController.pageNotFound);

    app.get('/', isUserAllowed, PropertyController.dashboardIndex);

    // Properties Module
    app.get('/properties', isUserAllowed, PropertyController.propertyList);
    app.get('/create-properties', isUserAllowed, PropertyController.propertyCreate);
    app.get('/edit-properties', isUserAllowed, PropertyController.propertyUpdate);
    app.post('/update-property-status', PropertyController.updatePropertyStatus);
    app.post('/update-property-wings-status', PropertyController.updatePropertyWingsStatus);
    app.post('/delete-property-image', PropertyController.deletePropertyImage);
    app.get('/view-properties/:id', isUserAllowed, PropertyController.propertyView);
    app.get('/edit-properties/:id', isUserAllowed, PropertyController.propertyEdit);

	// Categories Module
    app.get('/categories', CategoriesController.categoryList); //category list
	app.post('/change-category-status', CategoriesController.changeCategoryStatus); //change category status API
    app.get('/create-categories', CategoriesController.categoryCreate); //create category
	app.post("/category-store", CategoriesController.categoryAddValidationForm, CategoriesController.categoryAdd); // store category
	app.get('/create-category-checklist/:id', CategoriesController.createCheckList); //create category vise checklist add 
	app.post('/store-category-checklist', CategoriesController.addCheckListAValidation ,CategoriesController.storeChecklist); //store checklist
	app.get('/edit-category-checklist/:id', CategoriesController.checkList); //edit category page with view category checklist list page
	app.post('/change-checklist-status', CategoriesController.changeChecklistStatus); //change category status API
    app.post('/update-categories', CategoriesController.updateCategory); //update category
	app.get('/edit-checklist-details/:id', CategoriesController.editChecklistDetails); //edit checklist details page
	app.post('/update-checklist-details', CategoriesController.updateChecklistValidation, CategoriesController.updateChecklistDetails); //update checklist details    

	app.get('/create-checklist-multi-form/:id', CategoriesController.createChecklistMultiForm); //create checklist multi form page
    app.post('/update-form-create', CategoriesController.updateFormCreate); //create checklist multi form page
    // app.get('/store-checklist-form', CategoriesController.storeChecklistForm); //store checklist multi form
    // app.get('/edit-checklist-form', CategoriesController.editChecklistForm); //edit checklist page
    // app.get('/update-checklist-form', CategoriesController.updateChecklistForm); //update checklist multiform page

    // Users Module
    app.get('/users', isUserAllowed, UserController.userList); //user list
    app.get('/create-users', UserController.userCreate); //create user page
	app.post("/user-add", UserController.userAddValidation, UserController.userAdd); // user registration
    app.get('/edit-users/:id', isUserAllowed, UserController.userEdit); //edit user page
    app.post('/update-user', isUserAllowed, UserController.userUpdateValidation, UserController.userUpdate); //update user
    app.get('/view-users/:id', isUserAllowed, UserController.userView); //view user details
    app.post('/update-user-status/', isUserAllowed, UserController.updateUserStatus); //view user details

    // Task
    app.get('/task', isUserAllowed,TaskController.taskList);
    app.get('/property-task', isUserAllowed,TaskController.propertyUser);
    app.get('/create-task', isUserAllowed,TaskController.createTask);
    app.post('/create-task-submit',TaskController.createTaskSubmit);
    app.post('/update-task-submit',TaskController.updateTaskSubmit);
    app.get('/edit-task/:id', isUserAllowed,TaskController.editTask);
    app.get('/view-task/:id', isUserAllowed,TaskController.viewTask);

    // Manage Rating
    app.get('/manage-rating', ManageRatingController.manageRatingList);
    app.get('/assign-auditor', ManageRatingController.assignAuditor);
    app.get('/group-list', ManageRatingController.groupList);
    app.get('/edit-group', ManageRatingController.editGroup);
    app.get('/edit-group-name', ManageRatingController.editGroupName);
    app.get('/edit-topic', ManageRatingController.editTopic);

    // PPM Master
    app.get('/ppm', PpmController.PpmList);
    app.get('/view-ppm', PpmController.viewPpmList);
    app.get('/assign-ppm', PpmController.assignPpmList);
    app.get('/edit-ppm/:id', PpmController.editPpm);
    app.post('/create-ppm', PpmController.createPpm);
    app.post('/update-ppm-status', PpmController.updatePpmStatus);
    app.post('/update-ppm-name', PpmController.updatePpmName);
    app.post('/update-ppm-task', PpmController.updatePpmTask);
    app.post('/update-property-wing-status', PpmController.updatePropertyWingStatus);
    app.post('/update-ppm-task-status', PpmController.updatePpmTaskStatus);
    app.get('/properties-wise-view-ppm/:id', PpmController.propertiesWisePpmList);
    app.get('/ppm-details/:id/:pid', PpmController.ppmDetails);
    app.get('/edit-wing-category/:pid/:id', PpmController.editWingCategory);
    app.post('/edit-property-wing', PpmController.editPropertyWing);
    app.get('/property-wing-list', PpmController.propertyWingList);
    app.post('/add-property-wing', PpmController.addPropertyWing);

    // SOP
    app.get('/sop', isUserAllowed, SopController.sopList);
    app.get('/create-sop', isUserAllowed, SopController.createSop);
    app.post('/store-sop', isUserAllowed, SopController.storeSop);
    app.get('/edit-sop/:id', isUserAllowed, SopController.editSop);
    app.post('/update-sop', isUserAllowed, SopController.updateSop);
	app.post('/change-sop-status', SopController.changeSOPStatus); //change category status API
    app.post('/delete-sop-image', isUserAllowed, SopController.deleteSopImage);
    // app.post('/delete-sop/:id', isUserAllowed, SopController.deleteSop);
    app.get('/view-sop/:id', isUserAllowed, SopController.viewSop);

    // History 
    app.get('/history', HistoryController.historyList);
    app.get('/category-history/:id', HistoryController.categoryHistory);
    app.get('/category-checklist-history', HistoryController.categoryChecklistHistory);
    app.get('/view-checklist-history', HistoryController.viewChecklistHistory);

    // Setting 
    app.get('/setting', isUserAllowed, SettingController.settingList);
    app.post('/store-rating-setting', isUserAllowed, SettingController.storeSetting);

}