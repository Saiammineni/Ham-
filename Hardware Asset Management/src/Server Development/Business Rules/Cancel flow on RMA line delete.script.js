(function executeRule(current, previous /* null when async */) {
	new global.GlideQuery('sys_flow_context')
		.where('sys_id', current.flow_context)
		.select('sys_id')
		.forEach(function (flowContext) {
			HAMUtils.cancelFlowWithContextId(flowContext.sys_id,
				'Due to deletion of RMA Request line');
		});
	sn_hamp.HAMRMAUtils.processRMALineCancellation(current);
	sn_hamp.HAMRMAUtils.updateRMARequestState(current);
}(current, previous));