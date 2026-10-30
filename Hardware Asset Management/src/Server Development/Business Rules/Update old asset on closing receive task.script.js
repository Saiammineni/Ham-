(function executeRule(current, previous /* null when async */) {
	var assetUpdateJSON = {
		assigned_to: 'NULL',
		install_status: 6,	// in stock
		stockroom: current.zero_touch_req.return_stockroom,
		substatus: null
	};
	new global.GlideQuery('alm_hardware')
		.where('sys_id', current.zero_touch_req.asset)
		.update(assetUpdateJSON);
}(current, previous));