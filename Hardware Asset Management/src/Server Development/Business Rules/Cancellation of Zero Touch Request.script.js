(function executeRule(current, previous /*null when async*/) {
	// Cancel the zero touch refresh fulfillment request
	new global.GlideQuery('sn_itam_ztr_fulfillment_req')
		.where('sys_id',  current.fulfillment_request.sys_id)
		.update({state: 5});
})(current, previous);