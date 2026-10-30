(function executeRule(current, previous) {
	var asset = new global.GlideQuery('sn_hamp_m2m_hw_asset_disposal')
		.where('hardware_disposal', current.hardware_disposal)
		.where('hardware', current.hardware)
		.selectOne('sys_id')
		.isPresent();
	if (asset) {
		current.setAbortAction(true);
		gs.addErrorMessage(gs.getMessage('Asset already part of disposal order'));
	}
}(current, previous));