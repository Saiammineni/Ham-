function onChange(control, oldValue, newValue, isLoading, isTemplate) {
	if (isLoading || newValue === '' || !g_form.isNewRecord()) {
		return;
	}

	if (newValue === 'true') {
		if (g_scratchpad.is_csdm_enabled) {
			// Set lifecycle stage to Design and stage status to Build
			g_form.setValue('life_cycle_stage', 'Design');
			g_form.setValue('life_cycle_stage_status', 'Build');
		}

		g_form.setValue('status', 'Build');
	} else {
		if (g_scratchpad.is_csdm_enabled) {
			// Set lifecycle stage to Operational and stage status to In Use
			g_form.setValue('life_cycle_stage', 'Operational');
			g_form.setValue('life_cycle_stage_status', 'In Use');
		}
		g_form.setValue('status', 'In Production');
	}
}