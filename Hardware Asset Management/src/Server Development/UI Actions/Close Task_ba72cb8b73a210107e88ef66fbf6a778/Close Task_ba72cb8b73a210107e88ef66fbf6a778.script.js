function checkFields() {
	g_form.clearMessages();
	var flashColor = '#FFFACD';
	var message;
	var msgParams = [];
	if ((g_form.getValue('task_name') === 'prepare') && g_form.getValue('state') !== '4') {
		// check mandatory fields are filled on Prepare task
		if (!g_form.getValue('loaner_order.asset')) {
			msgParams.push(g_form.getLabelOf('loaner_order.asset'));
			g_form.flash('loaner_order.asset', flashColor, 0);
		}
		if (msgParams.length > 0) {
			message = getMessage('The following mandatory fields are not filled in: {0}');
			g_form.addErrorMessage(formatMessage(message, msgParams.join(', ')));
		}
	} else if ((g_form.getValue('task_name') === 'reclaim') && g_form.getValue('state') !== '4') {
		// check mandatory fields are filled on Reclaim task
		if (!g_form.getValue('return_stockroom')) {
			msgParams.push(g_form.getLabelOf('return_stockroom'));
			g_form.flash('return_stockroom', flashColor, 0);
		}
		if (msgParams.length > 0) {
			message = getMessage('The following mandatory fields are not filled in: {0}');
			g_form.addErrorMessage(formatMessage(message, msgParams.join(', ')));
		}
		var msg;
		if (g_form.getValue('loaner_order.asset_returned') === 'N') {
			// eslint-disable-next-line max-len
			msg = formatMessage(getMessage('To complete the task, update {0} value to Yes'), g_form.getLabelOf('loaner_order.asset_returned'));
			g_form.hideFieldMsg('loaner_order.asset_returned');
			g_form.showFieldMsg('loaner_order.asset_returned', msg, 'error');
			g_form.flash('loaner_order.asset_returned', flashColor, 0);
			msgParams.push(g_form.getLabelOf('loaner_order.asset_returned'));
		}
		if (g_form.getValue('loaner_order.is_asset_functional') === '') {
			// eslint-disable-next-line max-len
			msg = formatMessage(getMessage('To complete the task, update {0} value to either Yes or No'), g_form.getLabelOf('loaner_order.is_asset_functional'));
			g_form.hideFieldMsg('loaner_order.is_asset_functional');
			g_form.showFieldMsg('loaner_order.is_asset_functional', msg, 'error');
			g_form.flash('loaner_order.is_asset_functional', flashColor, 0);
			msgParams.push(g_form.getLabelOf('loaner_order.is_asset_functional'));
		}
	}
	if (msgParams.length === 0) {
		gsftSubmit(null, g_form.getFormElement(), 'close_loaner_task');
	}
}

function closeTask() {
	if (current.getValue('state') !== '4') {
		current.state = 3;
	}
	current.update();
	if (current.getValue('state') !== '3') { // redirect to task page only if its incomplete
		action.setRedirectURL(current);
	} else {
		action.setRedirectURL(current.loaner_order.getRefRecord());
	}
}

if (typeof window === 'undefined') {
	closeTask();
}