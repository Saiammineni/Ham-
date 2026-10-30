(function executeRule(current, previous) {
	if (String(current.asset.lease_contract) === String(current.contract.sys_id)) {
		new global.GlideQuery('alm_asset')
			.where('sys_id', current.asset)
			.update({
				lease_contract: null,
			});
	}
}(current, previous));