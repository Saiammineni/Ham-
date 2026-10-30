(function executeRule(current, previous) {
	if (current.isActionAborted()) { return; }
	var result = new sn_hamp.HAMLeaseContractExpirationUtils().handleTaskCompletion(current);
	if (!result.checksPassed) {
		if (result.message) { gs.addErrorMessage(result.message); }
		current.state = previous.state;
		current.active = true;
		gs.setRedirect('sn_hamp_contract_asset_task.do?sys_id=' + current.sys_id);
	} else {
		if (result.message) { gs.addInfoMessage(result.message); }
		if (gs.hasRole('contract_manager')) {
			gs.setRedirect('clm_m2m_contract_asset.do?sys_id=' + current.contract_asset);
		} else {
			gs.setRedirect('sn_hamp_contract_asset_task.do?sys_id=' + current.sys_id);
		}
	}
}(current, previous));