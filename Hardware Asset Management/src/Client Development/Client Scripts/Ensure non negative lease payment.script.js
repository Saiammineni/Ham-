function onChange(control, oldValue, newValue, isLoading, isTemplate) {
	if (isLoading || newValue === '') {
		return;
	}
	var currencyType = newValue.split(';')[0];
	var currencyVal = newValue.split(';')[1];

	if (parseFloat(currencyVal) < 0) {
		g_form.setValue('monthly_lease_payment', currencyType + ';' + 0.00);
		var errMsg = getMessage('Monthly lease payment should be positive');
		g_form.showFieldMsg('monthly_lease_payment', errMsg, 'error');
	}
}