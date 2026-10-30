function onCondition() {
	if (g_form.getValue('stage') === 'waiting_for_approval') {
		if (g_form.getValue('type_of_refresh') === 'single_model') {
			g_form.setReadOnly('replacement_model', false);
			g_form.setReadOnly('assets', false);
		} else if (g_form.getValue('type_of_refresh') === 'multi_model') {
			g_form.setReadOnly('multi_model_set', false);
		}
	}
}