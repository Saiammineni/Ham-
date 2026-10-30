(function executeRule(current, previous) {
	// Create Refresh Line
	var refreshUtils = new sn_hamp.HAMAssetRefreshUtils();
	if (refreshUtils.isRefreshReq(current.request_line)) {
		refreshUtils.createRefreshLine(current.asset.sys_id, current.request_line);
	}
}(current, previous));