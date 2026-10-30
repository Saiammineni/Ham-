(function executeRule(current, previous) {
	HAMUtils.cancelFlowWithContextId(current.flow_context, 'due to deletion of Hardware refresh line');
}(current, previous));