function setLocation(stockroom) {
	g_form.setValue('location', stockroom.location);
}

function onChange(control, oldValue, newValue, isLoading, isTemplate) {
	if (isLoading || newValue === '') {
		return;
	}
	if (g_form.getValue('location') === '') { g_form.getReference('stockroom', setLocation); }
}