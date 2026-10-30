(function executeRule(current, previous /* null when async */) {
	g_scratchpad.refresh_flow_context = current.getValue('flow_context');
}(current, previous));