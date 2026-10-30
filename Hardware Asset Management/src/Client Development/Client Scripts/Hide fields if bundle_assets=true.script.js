function onLoad() {
	if (g_scratchpad.bundle_assets === 'true') {
		g_form.setVisible('component_parameter', false);
		g_form.setVisible('master', false);
		g_form.setVisible('parent.main_component', false);
	}
}