(function executeRule(current, previous) {
	var allContractAssetsReachedConclusion = true;
	new global.GlideQuery('clm_m2m_contract_asset')
		.where('contract', current.getValue('contract'))
		.where('stage', 'NOT IN', ['completed', 'cancelled'])
		.selectOne()
		.ifPresent(function () { allContractAssetsReachedConclusion = false; });
	if (allContractAssetsReachedConclusion) {
		// Update substate from expiring to none
		new global.GlideQuery('ast_contract')
			.where('sys_id', current.getValue('contract'))
			.update({ substate: null });
	}
}(current, previous));