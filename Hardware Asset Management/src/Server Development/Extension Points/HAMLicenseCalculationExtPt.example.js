var HAMLicenseCalculationExtPt = Class.create();
HAMLicenseCalculationExtPt.prototype = {
  initialize: function() {},
  licensableResourceCategories: [],
  getResourceCategoryToEntitlementMap: function() { return {}; },
  process: function(/*array*/ optedInCategories) {},
  calculateResourceCount: function(/*Object*/ categoryObject) {},
  insertIntoLicenseReportTable: function(/*Object*/ categoryObject) {},
  type: 'HAMLicenseCalculationExtPt'
};