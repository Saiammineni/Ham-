(function() {
	new global.GlideQuery(sn_hamp.HAMConstants.ASSET_PROPERTY_TABLE)
		.where('key', sn_hamp.HAMConstants.HAMP_INDOOR_MAP_ASSET_PROPERTY)
		.updateMultiple({ value : gs.getProperty('sn_itam_common.sn_enable_indoormap_for_assets') });
}());