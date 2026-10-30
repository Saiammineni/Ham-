function onCondition() {
	g_form.setDisplay('is_reclaimed', true);
	g_form.setMandatory('is_reclaimed', true);
	if (g_scratchpad.consumable) {
		g_form.setDisplay('quantity_received', true);
		g_form.setMandatory('quantity_received', true);
	} else {
		g_form.setDisplay('quantity_received', false);
	}
}