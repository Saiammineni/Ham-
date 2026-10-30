function onSubmit() { // eslint-disable-line
	if (g_form.getValue('task_name') === 'receive'
        && g_form.getValue('asset_received') === 'N'
        && g_form.getValue('state') === '3') {
		g_form.addErrorMessage(getMessage('Asset must be received to close task'));
		return false;
	}
	return true;
}