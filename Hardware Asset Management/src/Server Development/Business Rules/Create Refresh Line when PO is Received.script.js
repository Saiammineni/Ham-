(function executeRule(current, previous) {
	var refreshUtils = new sn_hamp.HAMAssetRefreshUtils();
	if (refreshUtils.isRefreshReq(current.purchase_line.request_line)) {
		refreshUtils.createRefreshLine(current.sys_id, current.purchase_line.request_line);
	}
}(current, previous));