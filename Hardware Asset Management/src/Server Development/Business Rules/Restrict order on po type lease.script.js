(function executeRule(current, previous) {
	var openTasks = [];
	new global.GlideQuery('proc_po_item')
		.where('purchase_order', current.getUniqueValue())
		.whereNotNull('asset_task')
		.where('asset_task.state', '!=', 3)
		.select('asset_task.number')
		.forEach(function (openTask) { openTasks.push(openTask.asset_task.number); });

	if (openTasks.length > 0) {
		// eslint-disable-next-line max-len
		gs.addErrorMessage(gs.getMessage('The following tasks need to be completed to order the purchase order: {0}', openTasks.join(', ')));
		current.status = previous.status;
		global.ModelUtils.setAbortAction(current, true);
	}
}(current, previous));