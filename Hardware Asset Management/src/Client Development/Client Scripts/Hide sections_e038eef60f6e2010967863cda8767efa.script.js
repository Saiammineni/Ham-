function onLoad() {
	var taskName = g_form.getValue('task_name');
	switch (taskName) {
	case 'assessment':
		g_form.setSectionDisplay('repair', false);
		g_form.setSectionDisplay('shipment', false);
		g_form.setSectionDisplay('receive', false);
		g_form.setSectionDisplay('vendor_returnshipment', false);
		break;
	case 'onsite_repair':
		g_form.setSectionDisplay('shipment', false);
		g_form.setSectionDisplay('receive', false);
		g_form.setSectionDisplay('vendor_returnshipment', false);
		break;
	case 'shipment':
		g_form.setSectionDisplay('repair', false);
		g_form.setSectionDisplay('receive', false);
		g_form.setSectionDisplay('vendor_returnshipment', false);
		break;
	case 'vendor_rma_decision':
		g_form.setSectionDisplay('repair', false);
		g_form.setSectionDisplay('shipment', false);
		g_form.setSectionDisplay('receive', false);
		break;
	case 'receive':
		g_form.setSectionDisplay('repair', false);
		g_form.setSectionDisplay('shipment', false);
		g_form.setSectionDisplay('vendor_returnshipment', false);
		break;
	default:
		g_form.setSectionDisplay('repair', false);
		g_form.setSectionDisplay('shipment', false);
		g_form.setSectionDisplay('receive', false);
		g_form.setSectionDisplay('vendor_returnshipment', false);
		break;
	}
}