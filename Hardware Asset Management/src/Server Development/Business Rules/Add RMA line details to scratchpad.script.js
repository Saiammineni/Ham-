(function executeRule(current, previous /* null when async */) {
	g_scratchpad.rma_request_line_flow_context = current.getValue('flow_context');
}(current, previous));