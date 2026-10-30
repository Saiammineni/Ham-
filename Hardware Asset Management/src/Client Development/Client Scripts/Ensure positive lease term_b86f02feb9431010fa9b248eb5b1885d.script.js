function onChange(control, oldValue, newValue, isLoading, isTemplate) {
	if (isLoading || newValue === '') {
		return;
	}

	if (parseInt(newValue, 10) < 0) {
		var errMsg = getMessage('Lease term (months) must be a positive integer');
		g_form.showFieldMsg('lease_term_months', errMsg, 'error');
	}
}