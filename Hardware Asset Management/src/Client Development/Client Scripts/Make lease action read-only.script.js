function onLoad() {
	if (g_form.getValue('lease_action') !== ''
		|| g_form.getValue('stage') === 'cancelled') {
		g_form.setReadOnly('lease_action', true);
	}
}