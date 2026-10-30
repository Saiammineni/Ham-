(function executeRule(current, previous /* null when async */) {
	var defaultFlow = 'sn_hamp.hardware_asset_reclamation_line_flow';
	var HARDWARE_ASSET_RECLAMATION_LINE_DECISION = '6a1e5f73650a3010fa9b36b10fce5165';
	var decisionInputs = {};
	decisionInputs.hardware_asset_reclamation_line = current.sys_id;
	var flow = HAMUtils.getFlowFromDecisionTable(HARDWARE_ASSET_RECLAMATION_LINE_DECISION, decisionInputs, defaultFlow);
	if (gs.nil(flow)) {
		gs.addErrorMessage(gs.getMessage('Flow is not configured in decision table'));
	} else {
		var inputs = {};
		inputs.current = current;
		inputs.table_name = 'sn_hamp_asset_reclaim_line';
		var flowContextID = sn_hamp.HAMUtils.triggerFlowAsyncronously(flow, inputs);
		if (!gs.nil(flowContextID)) {
			current.setValue('flow_context', flowContextID);
			current.update();
		}
	}
}(current, previous));