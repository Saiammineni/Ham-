(function executeRule(current, previous /* null when async */) {
	if (current.isActionAborted()) {
		return;
	}
	if (current.asset.changes()) {
		if (!gs.nil(previous.asset)) {
			new sn_hamp.HampLoanerUtils().setAssetStatusOnRemoval(previous, previous.asset);
		}
		if (!gs.nil(current.asset)) {
			new sn_hamp.HampLoanerUtils().setAssetStatusOnSelection(current, current.asset);
		}
	}
	if (String(current.stage) === HampLoanerUtils.LOANER_ORDER_ACTION_CANCELLED) {
		new sn_hamp.HampLoanerUtils().setAssetStatusOnRemoval(
			current,
			current.asset,
			HampLoanerUtils.LOANER_ORDER_ACTION_CANCELLED
		);
	}
}(current, previous));