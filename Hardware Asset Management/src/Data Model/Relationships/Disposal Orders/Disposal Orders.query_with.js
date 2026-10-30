(function refineQuery(current, parent) {
	var disposalOrderIds = [];
	// Check if there is a planned asset
	new global.GlideQuery('sn_hamp_m2m_hw_asset_disposal')
		.where('hardware', parent.sys_id)
		.select('hardware_disposal')
		.forEach(function (plannedAsset) {
			disposalOrderIds.push(plannedAsset.hardware_disposal); 
		});
	current.addQuery('sys_id', 'IN', disposalOrderIds);
})(current, parent);