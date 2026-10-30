(function executeRule(current, previous /* null when async */) {
	var assetUpdateJSON = {
		install_status: 6,	// in stock
	};
	var evaluationStatus = current.getValue('evaluation_status');
	if (evaluationStatus === 'redeployable') {
		assetUpdateJSON.substatus = 'available';
	} else if (evaluationStatus === 'needs_repair') {
		assetUpdateJSON.substatus = 'pending_repair';
	} else if (evaluationStatus === 'dispose') {
		assetUpdateJSON.substatus = 'pending_disposal';
	}
	new global.GlideQuery('alm_asset')
		.where('sys_id', current.asset_reclaim_line.asset)
		.update(assetUpdateJSON);
}(current, previous));