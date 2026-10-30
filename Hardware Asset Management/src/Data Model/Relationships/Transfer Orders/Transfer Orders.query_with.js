(function refineQuery(current, parent) {
	var toIds = [];
	// Check if there is a TOL
	new global.GlideQuery('alm_transfer_order_line')
		.where('asset', parent.sys_id)
		.select('transfer_order')
		.forEach(function (transferOrderLine) {
			toIds.push(transferOrderLine.transfer_order); 
		});
	current.addQuery('sys_id', 'IN', toIds);
})(current, parent);