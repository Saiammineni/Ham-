(function executeRule(current, previous) {
	var assetRefreshUtils = new HAMAssetRefreshUtils();
	if (current.getValue('state') === '3') {
		var output = assetRefreshUtils.checkTaskCompletion(current);
		if (output.abort) {
			gs.addErrorMessage(output.message);
			current.state = previous.state;
			gs.setRedirect(current.getLink(true));
		} else {
			gs.addInfoMessage(output.message);
			gs.setRedirect(current.refresh_line.getRefRecord().getLink(true));
		}
	} else if (current.getValue('state') === '4' && !gs.nil(current.refreshing_asset)) {
		assetRefreshUtils.removeRefreshRequestLine(current.refreshing_asset.sys_id);
	}
}(current, previous));