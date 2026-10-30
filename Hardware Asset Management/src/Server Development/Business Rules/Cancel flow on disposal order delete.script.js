(function executeRule(current, previous /* null when async */) {
	// If request has a flow designer execution associated with it, cancel it.
	new global.GlideQuery('sys_flow_context')
		.where('source_record', current.sys_id)
		.select('sys_id')
		.forEach(function (flowContext) {
			// eslint-disable-next-line new-cap
			sn_fd.FlowAPI.cancel(flowContext.sys_id, 'due to deletion of Hardware disposal order');
		});
}(current, previous));