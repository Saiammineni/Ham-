(function executeRule(current, previous /* null when async */) {
	// If loaner order has a flow designer execution associated with it, cancel it.
	HAMUtils.cancelFlowWithContextId(current.flow_context, 'due to deletion of loaner order');

	var stage = String(current.stage);
	if ((stage === 'new' || stage === 'prepare') && !gs.nil(current.asset)) {
		new sn_hamp.HampLoanerUtils().setAssetStatusOnRemoval(
			current,
			current.asset,
			HampLoanerUtils.LOANER_ORDER_ACTION_DELETED
		);
	}
}(current, previous));