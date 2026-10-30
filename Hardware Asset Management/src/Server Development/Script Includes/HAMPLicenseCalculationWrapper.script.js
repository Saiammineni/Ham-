
var HAMPLicenseCalculationWrapper = Class.create();
HAMPLicenseCalculationWrapper.prototype = {
	initialize: function() {
		this.hampLicenseCalculationUtil = new sn_hamp.HAMPLicenseCalculation();
		this.licensableResourceCategories = this.hampLicenseCalculationUtil.licensableResourceCategories;
	},

	getResourceCategoryToEntitlementMap: function() {
		return this.hampLicenseCalculationUtil.getResourceCategoryToEntitlementMap();
	},

	process: function( /*array*/ optedInCategories) {
		this.hampLicenseCalculationUtil.process(optedInCategories);
	},

	type: 'HAMPLicenseCalculationWrapper' 
};