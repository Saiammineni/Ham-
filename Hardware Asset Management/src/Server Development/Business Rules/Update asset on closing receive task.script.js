(function executeRule(current, previous /* null when async */) {
	var assetGr = new GlideRecord('alm_hardware');
	assetGr.get(current.zero_touch_req.refreshed_asset);
	assetGr.reserved_for = '';
	assetGr.install_status = 1; // In use
	assetGr.substatus = '';
	assetGr.assigned_to = current.zero_touch_req.requested_for;
	assetGr.update();
}(current, previous));