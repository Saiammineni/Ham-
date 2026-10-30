function showRMARequestFlowContext() {
	var url = new GlideURL('/$flow-designer.do#/operations/context/' + g_scratchpad.rma_request_flow_context);
	g_navigation.open(url.getURL(), '_blank');
}