function onLoad() {
	if (!g_user.hasRole('model_manager')) {
		g_form.setSectionDisplay('normalization', false);
	}
}