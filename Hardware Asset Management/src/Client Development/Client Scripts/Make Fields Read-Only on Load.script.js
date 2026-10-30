function onLoad() {
	// Type appropriate comment here, and begin script below
	if (!g_form.isNewRecord()) {
		g_form.setReadOnly('type', true);
		g_form.setReadOnly('stockroom', true);
		g_form.setReadOnly('location', true);
		g_form.setReadOnly('scheduled_date', true);
	}
}