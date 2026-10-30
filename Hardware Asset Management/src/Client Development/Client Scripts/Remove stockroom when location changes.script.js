function onChange(control, oldValue, newValue, isLoading, isTemplate) {
	if (isLoading) {
		return;
	}

	function checkLocation(stockroom) {
		if (g_form.getValue('location') !== stockroom.location) {
			g_form.clearValue('stockroom');
		}
	}

	g_form.getReference('stockroom', checkLocation);
}
