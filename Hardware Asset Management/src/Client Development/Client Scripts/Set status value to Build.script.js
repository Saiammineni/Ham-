function onChange(control, oldValue, newValue, isLoading, isTemplate) {
	if (isLoading || newValue === '' || !g_form.isNewRecord()) {
		return;
	}

	if (newValue === 'true') {
		if (g_scratchpad.is_csdm_enabled) {
			// Set lifecycle stage to Design and stage status to Build
			g_form.setValue('life_cycle_stage', 'a6834291b7620010ee0d3177ee11a9f5');
			g_form.setValue('life_cycle_stage_status', 'c2d88a55b7620010ee0d3177ee11a9ae');
		}

		g_form.setValue('status', 'Build');
	} else {
		if (g_scratchpad.is_csdm_enabled) {
			// Set lifecycle stage to Operational and stage status to In Use
			g_form.setValue('life_cycle_stage', '53584655b7620010ee0d3177ee11a97f');
			g_form.setValue('life_cycle_stage_status', 'e4990295b7620010ee0d3177ee11a9db');
		}
		g_form.setValue('status', 'In Production');
	}
}