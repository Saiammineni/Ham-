(function executeRule(current, previous /* null when async */) {
	new global.GlideQuery('asset_reclamation_request')
		.where('sys_id', current.getValue('asset_reclaim_request'))
		.update({
			state: 2,
		});
}(current, previous));