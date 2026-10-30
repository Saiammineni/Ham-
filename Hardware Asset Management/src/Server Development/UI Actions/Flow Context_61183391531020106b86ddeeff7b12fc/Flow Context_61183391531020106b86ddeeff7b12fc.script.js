function showContractFlowContext() {
	var url = new GlideURL('/$flow-designer.do#/operations/context/' + g_scratchpad.contract_flow_context);
	g_navigation.open(url.getURL(), '_blank');
}