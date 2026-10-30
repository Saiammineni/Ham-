function onChange(control, oldValue, newValue, isLoading, isTemplate) {
	if (isLoading || newValue === '') {
		return;
	}
	// If operation has failed, display message
	var contentType = g_form.getValue('content_type');
	if (newValue === 'failed') {
		GlideUI.get().clearOutputMessages();
		g_form.addErrorMessage(formatMessage(getMessage(
			'Failed to {0} the content. Please contact your system administrator for failure details.'
		), contentType));
	}
}