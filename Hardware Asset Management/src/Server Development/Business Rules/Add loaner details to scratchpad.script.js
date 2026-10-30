(function executeRule(current, previous /* null when async */) {
	g_scratchpad.asset_prepared = current.asset_prepared;
	g_scratchpad.loaner_flow_context = current.getValue('flow_context');
	g_scratchpad.is_reclaim_task_created = false;
	g_scratchpad.is_waitlisted = current.is_waitlisted;
	g_scratchpad.model = String(current.model.sys_id);
	g_scratchpad.asset = String(current.asset.sys_id);
	g_scratchpad.work_notes = String(current.work_notes);
	new global.GlideQuery('sn_hamp_loaner_asset_task')
		.where('loaner_order', current.sys_id)
		.where('task_name', 'reclaim')
		.selectOne()
		.ifPresent(function() {
			g_scratchpad.is_reclaim_task_created = true;
		});
	g_scratchpad.lead_time = current.lead_time;
	g_scratchpad.is_stock_insufficient = null;
}(current, previous));