function onSubmit() { // eslint-disable-line
	g_form.clearMessages();
	var flashColor = '#FFFACD';
	if(NOW.isUsingPolaris) {
        flashColor = "RGB(var(--now-alert--warning--background-color,var(--now-color_alert--warning-0,244,240,191)))";
    }
	var message;
	var msgParams = [];
	var quantityReceived = g_form.getValue('quantity_received');
	var submit = true;
	if (g_form.getValue('task_name') === 'receive') {
		// check mandatory fields are filled on receive task
		if (g_form.getValue('is_reclaimed') === 'false' && g_form.getValue('state') === '3') {
			msgParams.push(g_form.getLabelOf('is_reclaimed'));
			g_form.flash('is_reclaimed', flashColor, 0);
			message = getMessage('The \'Is asset reclaimed?\' field needs to be checked to close the task');
			g_form.addErrorMessage(message);
			submit = false;
		}
		if (g_scratchpad.consumable && ((quantityReceived === '') || (parseInt(quantityReceived, 10) < 0))) {
			msgParams.push(g_form.getLabelOf('quantity_received'));
			g_form.flash('quantity_received', flashColor, 0);
			message = getMessage('The \'Quantity received\' field needs to have a value of 0 or greater');
			g_form.addErrorMessage(message);
			submit = false;
		}
	}
	return submit;
}