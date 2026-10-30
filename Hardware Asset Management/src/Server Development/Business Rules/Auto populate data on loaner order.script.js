(function executeRule(current, previous /* null when async */) {
	if (current.getValue('task_name') === 'prepare') {
		new HampLoanerUtils().updateAssetPrepared(current);
		new HampLoanerUtils().updateAssetStockroomOnLoanerOrder(current);
	}
	if (current.getValue('task_name') === 'reclaim' && gs.nil(current.loaner_order.returned_on)) {
		new HampLoanerUtils().updateReturnedOn(current);
	}
	// eslint-disable-next-line max-len
	var taskName = GlideStringUtil.escapeHTML(current.task_name.getDisplayValue());
	gs.addInfoMessage(gs.getMessage('{0} task of loaner order {1} is successfully completed.', [taskName, current.loaner_order.number]));
}(current, previous));