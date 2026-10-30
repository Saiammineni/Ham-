function checkManadatory() {
	g_form.clearMessages();
	var flashColor = '#FFFACD';
	if(NOW.isUsingPolaris) {
        flashColor = "RGB(var(--now-alert--warning--background-color,var(--now-color_alert--warning-0,244,240,191)))";
    }
	var message;
	var msgParams = [];
	if ((g_form.getValue('task_name') === 'schedule')
	&& g_form.getValue('state') !== '4'
	&& (!g_form.getValue('hardware_disposal.scheduled_date')
	|| !g_form.getValue('hardware_disposal.vendor'))) {
		// check mandatory fields are filled on Schedule pickup task
		if (!g_form.getValue('hardware_disposal.scheduled_date')) {
			msgParams.push(g_form.getLabelOf('hardware_disposal.scheduled_date'));
			g_form.flash('hardware_disposal.scheduled_date', flashColor, 0);
		}
		if (!g_form.getValue('hardware_disposal.vendor')) {
			msgParams.push(g_form.getLabelOf('hardware_disposal.vendor'));
			g_form.flash('hardware_disposal.vendor', flashColor, 0);
		}
		message = getMessage('The following mandatory fields are not filled in: {0}');
		g_form.addErrorMessage(formatMessage(message, msgParams.join(', ')));
	} else if ((g_form.getValue('task_name') === 'depart')
	&& g_form.getValue('state') !== '4'
	&& (!g_form.getValue('hardware_disposal.scheduled_date')
	|| !g_form.getValue('hardware_disposal.vendor')
	|| !g_form.getValue('hardware_disposal.vendor_order_id')
	|| !g_form.getValue('hardware_disposal.pickup_contact'))) {
		// check mandatory fields are filled on Asset Departure task
		if (!g_form.getValue('hardware_disposal.scheduled_date')) {
			msgParams.push(g_form.getLabelOf('hardware_disposal.scheduled_date'));
			g_form.flash('hardware_disposal.scheduled_date', flashColor, 0);
		}
		if (!g_form.getValue('hardware_disposal.vendor')) {
			msgParams.push(g_form.getLabelOf('hardware_disposal.vendor'));
			g_form.flash('hardware_disposal.vendor', flashColor, 0);
		}
		if (!g_form.getValue('hardware_disposal.vendor_order_id')) {
			msgParams.push(g_form.getLabelOf('hardware_disposal.vendor_order_id'));
			g_form.flash('hardware_disposal.vendor_order_id', flashColor, 0);
		}
		if (!g_form.getValue('hardware_disposal.pickup_contact')) {
			msgParams.push(g_form.getLabelOf('hardware_disposal.pickup_contact'));
			g_form.flash('hardware_disposal.pickup_contact', flashColor, 0);
		}
		message = getMessage('The following mandatory fields are not filled in: {0}');
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
		action.setRedirectURL(current.hardware_disposal.getRefRecord());
	}
}

if (typeof window === 'undefined') {
	closeTask();
}