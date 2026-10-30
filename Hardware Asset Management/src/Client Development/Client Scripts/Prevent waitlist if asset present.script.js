function onChange(control, oldValue, newValue, isLoading, isTemplate) {
	if (isLoading || newValue === '') { return; }

	if (newValue === 'false') { return; }

	if (newValue === 'true' && g_form.getValue('asset') !== '') {
		g_form.addErrorMessage(
			getMessage('Asset needs to be cleared to waitlist the request')
		);
		g_form.setValue('is_waitlisted', false);
	}
}