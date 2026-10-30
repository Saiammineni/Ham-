(function executeRule(current, previous /*null when async*/) {
	var requestGr = new GlideRecord(HAMZeroTouchAssetRefreshUtils.ZERO_TOUCH_REFRESH_REQ_TABLE);
	requestGr.get(current.zero_touch_req);
	var taskName = current.getValue('task_name');
	var taskID = current.sys_id;
	var refreshMethod = requestGr.getValue('refresh_method');
	var receivedDate = new GlideDateTime();
	// Closure of shipment if it is ready for pickup
	if (taskName === 'ready_for_pickup') {
		HAMZeroTouchAssetRefreshUtils.closeShipmentForZTR(taskID, requestGr.getValue('refreshed_asset'), receivedDate, current.closed_by.name);
	}
	// Closure of shipment if it is user recieive asset and refresh method is ship for new asset
	if ((refreshMethod === 'ship' && taskName === 'receive_asset')) {
		HAMZeroTouchAssetRefreshUtils.closeShipmentForZTR(taskID, requestGr.getValue('refreshed_asset'), receivedDate, requestGr.requested_for.name);
	}
	// Closure of shipment if it is return asset recieve for old asset
	if (taskName === 'receive_return_asset') {
		HAMZeroTouchAssetRefreshUtils.closeShipmentForZTR(taskID, requestGr.getValue('asset'), receivedDate, current.closed_by.name);
	}
})(current, previous);