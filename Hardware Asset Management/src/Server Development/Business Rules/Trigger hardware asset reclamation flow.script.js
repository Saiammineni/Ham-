(function executeRule(current, previous /* null when async */) {
	var defaultFlow = 'sn_hamp.hardware_asset_reclamation_flow';
	var HARDWARE_ASSET_RECLAMATION_DECISION_ID = 'a1abad6b65823010fa9b36b10fce5146';
	var decisionInputs = {};
	decisionInputs.asset_reclamation_request = current.sys_id;
	var flow = HAMUtils.getFlowFromDecisionTable(HARDWARE_ASSET_RECLAMATION_DECISION_ID, decisionInputs, defaultFlow);
	if (gs.nil(flow)) {
		gs.addErrorMessage(gs.getMessage('Flow is not configured in decision table'));
	} else {
		var inputs = {};
		inputs.current = current;
		inputs.table_name = 'asset_reclamation_request';
		var flowContextID = sn_hamp.HAMUtils.triggerFlowAsyncronously(flow, inputs);
		if (!gs.nil(flowContextID)) {
			var flowContext = {};
			if (!gs.nil(current.flow_context)) {
				flowContext = JSON.parse(current.flow_context);
			}
			flowContext['Hardware asset reclamation flow'] = flowContextID;
			current.setValue('flow_context', JSON.stringify(flowContext));
			current.update();
		}
	}
}(current, previous));