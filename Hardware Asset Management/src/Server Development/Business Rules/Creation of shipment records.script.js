function getAddress(street, city, state, country) {
		var address = '';
		if (street) {
			address = address + street + ', ';
		}
		if (city) {
			address = address + city + ', ';
		}
		if (state) {
			address = address + state + ', ';
		}
		if (country) {
			address = address + country + ', ';
		}
		return address.slice(0,-2);
	}
(function executeRule(current, previous /*null when async*/) {
	var requestGr = new GlideRecord(HAMZeroTouchAssetRefreshUtils.ZERO_TOUCH_REFRESH_REQ_TABLE);
	requestGr.get(current.zero_touch_req);
	var taskName = current.getValue('task_name');
	var taskID = current.sys_id;
	var refreshMethod = requestGr.getValue('refresh_method');
	var shippedBy;
	var shipDate = new GlideDateTime();
	if (requestGr.provider) {
		shippedBy = requestGr.provider.name;
	}
	var address = getAddress(requestGr.street, requestGr.city, requestGr.state_loc, requestGr.country);
	// Creation of shipment if it is ready for pickup
	if (taskName === 'ready_for_pickup') {
		HAMZeroTouchAssetRefreshUtils.createShipmentForZTR(taskID, requestGr.getValue('refreshed_asset'), requestGr.tracking_number, requestGr.carrier, shipDate, shippedBy, address, null);
	}
	// Creation of shipment if it is user recieive asset and refresh method is ship for new asset
	if ((refreshMethod === 'ship' && taskName === 'receive_asset')) {
		HAMZeroTouchAssetRefreshUtils.createShipmentForZTR(taskID, requestGr.getValue('refreshed_asset'), requestGr.tracking_number, requestGr.carrier, shipDate, shippedBy, address, null);
	}
	// Creation of shipment if it is return asset recieve for old asset
	if (taskName === 'receive_return_asset') {
		if (refreshMethod === 'pickup') {
			address = null;
		}
		HAMZeroTouchAssetRefreshUtils.createShipmentForZTR(taskID, requestGr.getValue('asset'), requestGr.return_tracking_number, requestGr.return_carrier, null, requestGr.requested_for.name, requestGr.return_stockroom.location.name, address);
	}
})(current, previous);
