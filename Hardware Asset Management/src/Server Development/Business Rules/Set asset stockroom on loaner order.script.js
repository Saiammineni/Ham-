(function executeRule(current, previous) {
	if (gs.nil(current.asset)) {
		current.asset_stockroom = '';
	} else {
		current.asset_stockroom = current.asset.stockroom;
	}
}(current, previous));