(function executeRule(current, previous) {
	// Create Refresh Line
	var refreshUtils = new sn_hamp.HAMAssetRefreshUtils();
	if (refreshUtils.isRefreshReq(current.parent.sys_id)) {
		refreshUtils.createRefreshLine(current.asset.sys_id, current.parent);
	}
}(current, previous));