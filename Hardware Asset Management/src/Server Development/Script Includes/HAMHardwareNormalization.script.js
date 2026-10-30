var HAMHardwareNormalization = Class.create();
HAMHardwareNormalization.prototype = Object.extendsObject(global.AssetManagementPerDomainAssetProcessSettingBaseJob, {

	initialize: function() {},

	runJob: function() {
		new sn_hamp.HAMHardwareNormalizationEngine().runHwNormalizationJob();
		if (sn_hamp.HAMAppUtils.isOnlyAppLicensed(sn_hamp.HAMConstants.ZTM_APP)) {
			return;
		}
		var updateAllAssetNames = gs.getProperty(sn_hamp.HAMConstants.UPDATE_ASSET_NAME_PROPERTY);
		if (updateAllAssetNames === 'true') {
			var startTime = GlideDate().getDisplayValue();
			new sn_hamp.HAMHardwareNormalizationEngine().reCalculateDisplayName();
			this.updateLastRunDate(startTime);
		}
	},
	updateLastRunDate: function(startTime) {
		new global.GlideQuery(sn_hamp.HAMConstants.ASSET_PROPERTY_TABLE)
			.where('key', sn_hamp.HAMConstants.RECALCULATE_ASSET_NAME_LAST_RUN_DATE_PROPERTY)
			.updateMultiple({
				value: startTime,
			});
	},

	type: 'HAMHardwareNormalization',
});