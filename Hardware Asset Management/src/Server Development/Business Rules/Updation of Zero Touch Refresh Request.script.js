(function executeRule(current, previous /*null when async*/) {
	// Update the order state of zero touch refresh request
	var zeroTouchRefReq = new GlideRecord('sn_hamp_ztr_request');
	zeroTouchRefReq.addQuery('fulfillment_request', current.sys_id);
	zeroTouchRefReq.query();
	if (zeroTouchRefReq.next()) {
		zeroTouchRefReq.order_state = current.state;
		// If order state is shipped then tracking details are set to request
		if (current.getValue('state') === '3') {
			zeroTouchRefReq.tracking_number = current.tracking_number;
			zeroTouchRefReq.carrier = current.carrier;
			zeroTouchRefReq.return_tracking_number = current.return_tracking_number;
			zeroTouchRefReq.return_carrier = current.return_carrier;
		}
		zeroTouchRefReq.update();	
	}

})(current, previous);