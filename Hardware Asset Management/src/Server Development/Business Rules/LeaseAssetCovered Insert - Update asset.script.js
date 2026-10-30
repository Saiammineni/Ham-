(function executeRule(current, previous) {
	new global.GlideQuery('alm_asset')
		.where('sys_id', current.getValue('asset'))
		.update({
			lease_contract: current.getValue('contract'),
		});
}(current, previous));