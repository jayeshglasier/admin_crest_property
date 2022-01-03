const express = require("express");
const router = new express.Router();
const auth = require("../middleware/auth");
const AuthController = require("../controllers/admin/AuthController");
const UserController = require("../controllers/admin/UserController");
const PropertyController = require("../controllers/admin/PropertyController");
const SopController = require("../controllers/admin/SopController");
const CategoriesController = require("../controllers/admin/CategoriesController");

router.post("/register", AuthController.registerValidation, AuthController.register); // user registration
router.post("/login", AuthController.login); // user login
router.post("/forgot-password", AuthController.forgotPassword); // Forget Password to send mail

// Supervisor list
router.post("/supervisor-add", auth, UserController.supervisorAddValidation, UserController.supervisorAdd); // user registration

// Property Name
router.post("/property-list", PropertyController.propertyList); // property list
router.post("/property-add", PropertyController.propertyAddValidation,PropertyController.propertyAdd); // property add
router.post('/property-update', PropertyController.propertyUpdateValidation,PropertyController.propertyUpdate); // property add

// Category name add
// router.post("/category-add", CategoriesController.categoryAddValidation, CategoriesController.categoryAdd); // category add

module.exports = router;