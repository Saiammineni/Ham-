var HAMReportFilters = Class.create();
HAMReportFilters.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {
	/* *************************************************************************
	*                              Internal Utils
	************************************************************************* */
	removeElementFromArray: function (array, element) {
		var pos = array.indexOf(element);
		if (pos > -1) { array.splice(pos, 1); }
	},

	removeElementsFromArray: function (array, elementsArray) {
		for (var i = 0; i < elementsArray.length; i++) {
			this.removeElementFromArray(array, elementsArray[i]);
		}
	},

	isEAMActive: function () { return GlidePluginManager.isActive('sn_eam'); },

	getAssetClassesExcludingEAMClasses: function () {
		var assetClasses = HAMUtils.getTableExtensions('alm_asset');
		if (this.isEAMActive()) {
			var eamAssetClasses = [].concat(HAMUtils.getTableExtensions(HAMConstants.EAM_ASSET_BASE_CLASS),HAMUtils.getTableExtensions(HAMConstants.ASSET_GROUP_BASE_CLASS));
			this.removeElementsFromArray(assetClasses, eamAssetClasses);
		}
		return assetClasses;
	},

	getModelClassesExcludingEAMClasses: function () {
		var modelClasses = HAMUtils.getTableExtensions('cmdb_model');
		if (this.isEAMActive()) {
			var eamModelClasses = HAMUtils.getTableExtensions(HAMConstants.EAM_MODEL_BASE_CLASS);
			this.removeElementsFromArray(modelClasses, eamModelClasses);
		}
		return modelClasses;
	},

	/* *************************************************************************
	*                                Report Filters
	************************************************************************* */
	getIncompleteAssetsClassFilter: function () {
		var assetClasses = this.getAssetClassesExcludingEAMClasses();
		var excludeClasses = [
			global.AssetManagementConstants.ASSET_CLASSES.CONSUMABLE,
			global.AssetManagementConstants.ASSET_CLASSES.SOFTWARE_ENTITLEMENT,
			global.AssetManagementConstants.ASSET_CLASSES.BUNDLE,
		];
		this.removeElementsFromArray(assetClasses, excludeClasses);
		return assetClasses;
	},

	getAssetIncidentFrequencyClassFilter: function () {
		var assetClasses = this.getAssetClassesExcludingEAMClasses();
		var excludeClasses = [
			global.AssetManagementConstants.ASSET_CLASSES.CONSUMABLE,
			global.AssetManagementConstants.ASSET_CLASSES.SOFTWARE_ENTITLEMENT,
			global.AssetManagementConstants.ASSET_CLASSES.BUNDLE,
		];
		this.removeElementsFromArray(assetClasses, excludeClasses);
		return assetClasses;
	},

	getActiveAssetsNotDiscoveredClassFilter: function () {
		var assetClasses = this.getAssetClassesExcludingEAMClasses();
		var excludeClasses = [
			global.AssetManagementConstants.ASSET_CLASSES.CONSUMABLE,
			global.AssetManagementConstants.ASSET_CLASSES.SOFTWARE_ENTITLEMENT,
			global.AssetManagementConstants.ASSET_CLASSES.BUNDLE,
		];
		this.removeElementsFromArray(assetClasses, excludeClasses);
		return assetClasses;
	},

	getActiveStockRulesModelClassFilter: function () {
		return this.getModelClassesExcludingEAMClasses();
	},

	getNewHardwareAssetsFoundByAuditsClassFilter: function () {
		return this.getAssetClassesExcludingEAMClasses();
	},

	getOpenRMARequestLinesClassFilter: function () {
		return this.getAssetClassesExcludingEAMClasses();
	},
	
	getEAMAssetClassesToBeExcluded: function () {
		if (this.isEAMActive()) {
			return HAMUtils.getEAMAssetClasses();
		}
		return;
	},
	
	getEAMModelClassesToBeExcluded: function () {
		if (this.isEAMActive()) {
			return HAMUtils.getEAMModelClasses();
		}
		return;
	},
	
	getCustomAssetClassesExcludingEAM: function() {
		var customClasses =  gs.getProperty('sn_itam_workspace.customExtendedAssetClasses');
		if (customClasses) {
			var eamModelClasses = this.getEAMAssetClassesToBeExcluded();
			var customExtendedAssetClasses = customClasses.split(',');
			// Filtering out the EAM classes from extended classes
			this.removeElementsFromArray(customExtendedAssetClasses, eamModelClasses);
			return customExtendedAssetClasses.toString();
		}
		return customClasses;
	},

	getEAMConsumablesToBeExcluded: function () {
		if (HAMUtils.isEAMDataModelInstalled()) {
			return HAMUtils.getEAMModelClasses();
		}
		return;
	},

	getEnterpriseModelClassesToBeExcluded: function () {
		if (HAMUtils.isEAMDataModelInstalled()) {
			return HAMUtils.getEAMModelClasses();
		}
		return;
	},

	getEAMBundlesWithHardwareComponentsFilter: function () {
		var bundleModels = '';
		if (HAMUtils.isEAMDataModelInstalled()) {
			bundleModels = HAMUtils.getEAMBundlesWithHardwareComponents();
		}
		return bundleModels;
	},
	type: 'HAMReportFilters',
});