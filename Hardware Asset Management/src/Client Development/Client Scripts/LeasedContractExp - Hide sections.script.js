function onLoad() {
	var leaseAction = g_form.getValue('lease_action');
	switch (leaseAction) {
	case 'return':
		g_form.setSectionDisplay('buyout', false);
		g_form.setSectionDisplay('extension', false);
		break;
	case 'buyout':
		g_form.setSectionDisplay('return', false);
		g_form.setSectionDisplay('extension', false);
		break;
	case 'extend':
		g_form.setSectionDisplay('return', false);
		g_form.setSectionDisplay('buyout', false);
		break;
	default:
		g_form.setSectionDisplay('return', false);
		g_form.setSectionDisplay('buyout', false);
		g_form.setSectionDisplay('extension', false);
		break;
	}
}