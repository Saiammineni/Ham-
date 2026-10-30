function showRefreshFlowContext () {
	var url = new GlideURL('/$flow-designer.do#/operations/context/' + g_scratchpad.refresh_flow_context);
	g_navigation.open(url.getURL(), '_blank');
}