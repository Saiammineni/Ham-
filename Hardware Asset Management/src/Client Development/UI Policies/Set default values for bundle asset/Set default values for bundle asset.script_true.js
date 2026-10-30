function onCondition() {
	if (g_form.isNewRecord()) {
		g_form.setValue('model_category', '94028b6a1b5310002502fbcd2c071315');
		g_form.setValue('install_status', '11');
	}
	
	g_form.setReadOnly('model_category', true);
}