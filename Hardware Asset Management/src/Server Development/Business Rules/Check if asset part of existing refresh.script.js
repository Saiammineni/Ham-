(function executeRule(current, previous /*null when async*/) {

	var ztrGr = new global.GlideQuery(HAMZeroTouchAssetRefreshUtils.ZERO_TOUCH_REFRESH_REQ_TABLE)
					.where('asset', current.asset)
					.where('state', 1)
					.limit(1)
					.select(['number','asset.display_name'])
					.toArray(1);
	
	if(ztrGr.length > 0){
		current.setAbortAction(true);
		gs.addErrorMessage(gs.getEscapedMessage('The selected asset {0} is already part of the existing Zero touch refresh request {1}', [ztrGr[0].asset.display_name, ztrGr[0].number]));
		return;
	}

	var assetGr = new GlideRecord(HAMZeroTouchAssetRefreshUtils.HARDWARE_ASSET_TABLE);
	assetGr.get(current.asset);

	if (assetGr.refresh_request_line && assetGr.refresh_request_line.stage.toString() !== 'Request Cancelled') {
		current.setAbortAction(true);
		gs.addErrorMessage(gs.getEscapedMessage('The selected asset {0} is already part of the existing Hardware asset refresh request {1}', [assetGr.getDisplayValue(), assetGr.refresh_request_line.request.getDisplayValue()]));
		return;
	}

})(current, previous);