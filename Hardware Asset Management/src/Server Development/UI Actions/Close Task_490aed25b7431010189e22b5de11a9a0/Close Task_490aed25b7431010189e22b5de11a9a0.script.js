function checkManadatoryFields() {
	g_form.clearMessages();
	var flashColor = '#FFFACD';
	var message;
	var msgParams = [];
	if ((g_form.getValue('task_name') === 'prepare')
		&& g_form.getValue('state') !== '4'
		&& (!g_form.getValue('refreshing_asset'))) {
		// check mandatory fields are filled on Prepare asset task
		msgParams.push(g_form.getLabelOf('refreshing_asset'));
		g_form.flash('refreshing_asset', flashColor, 0);
		message = getMessage('The following mandatory fields are not filled in: {0}');
		g_form.addErrorMessage(formatMessage(message, msgParams.join(', ')));
	} else if ((g_form.getValue('task_name') === 'schedule')
		&& g_form.getValue('state') !== '4'
		&& g_form.getValue('state') !== '7'
		&& (!g_form.getValue('refresh_line.scheduled_date'))) {
		// check mandatory fields are filled on Schedule refresh task
		msgParams.push(g_form.getLabelOf('refresh_line.scheduled_date'));
		g_form.flash('refresh_line.scheduled_date', flashColor, 0);
		message = getMessage('The following mandatory fields are not filled in: {0}');
		g_form.addErrorMessage(formatMessage(message, msgParams.join(', ')));
	} else if ((g_form.getValue('task_name') === 'reclaim')
		&& g_form.getValue('state') !== '4'
		&& g_form.getValue('state') !== '7'
		&& (g_form.getValue('refresh_line.is_reclaimed') !== 'Y')) {
		// check mandatory fields are filled on Deploy new task
		msgParams.push(g_form.getLabelOf('refresh_line.is_reclaimed'));
		g_form.flash('refresh_line.is_reclaimed', flashColor, 0);
		message = getMessage('To complete the task, update {0} value to Yes.');
		g_form.addErrorMessage(formatMessage(message, msgParams.join(', ')));
	} else {
		gsftSubmit(null, g_form.getFormElement(), 'close_task');
	}
}

function closeTask() {
	if (current.getValue('state') !== '4') {
		if ((current.getValue('state') === '1' || current.getValue('state') === '2')) {
			current.state = 3;
		}
	}
	current.update();
	if (current.getValue('state') !== '3') { // redirect to task page only if its incomplete
		action.setRedirectURL(current);
	} else {
		action.setRedirectURL(current.refresh_line.getRefRecord());
	}
}

if (typeof window === 'undefined') {
	closeTask();
}