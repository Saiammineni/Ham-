function onLoad() {
	if (!g_scratchpad.is_trm_installed) {
		g_form.setVisible('trm_product_phase', false);
	} else if (!g_scratchpad.can_read_trm_lifecycle) {
		g_form.hideRelatedList('sn_apm_trm_standards_product_lifecycle.hardware_model');
	}
}