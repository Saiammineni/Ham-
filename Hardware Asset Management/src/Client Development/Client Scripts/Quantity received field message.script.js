function onChange(control, oldValue, newValue, isLoading, isTemplate) {
	if (newValue !== '' && newValue !== g_scratchpad.quantity) {
		g_form.hideFieldMsg('quantity_received');
		g_form.showFieldMsg('quantity_received', 'Quantity received does not match the quantity expected.', 'info');
	}
}