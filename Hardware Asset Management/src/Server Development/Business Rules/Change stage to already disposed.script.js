(function executeRule(current, previous /* null when async */) {
	new global.GlideQuery('sn_hamp_m2m_hw_asset_disposal')
		.where('hardware', current.hardware)
		.where('sys_id', '!=', current.sys_id)
		.where('stage', '!=', 'invalid')
		.updateMultiple({ stage: 'already_disposed' });
	if (GlidePluginManager.isActive('com.sn_eam') || GlidePluginManager.isActive('sn_eam')) {
		new global.GlideQuery('sn_eam_m2m_asset_disposal')
			.where('asset', current.hardware)
			.where('stage', '!=', 'invalid')
			.updateMultiple({ stage: 'already_disposed' });
	}
}(current, previous));