function onLoad() {
	var stage = g_form.getValue('stage');
	var rmaAction = g_form.getValue('rma_action');
	if (rmaAction === 'offsite') {
		if (stage === 'assess' || stage === 'ship') {
			g_form.setSectionDisplay('shipment', false);
		}
		if (stage === 'assess' || stage === 'ship' || stage === 'vendor_confirmation') {
			g_form.setSectionDisplay('vendor_returnshipment', false);
		}
	} else {
		g_form.setSectionDisplay('shipment', false);
		g_form.setSectionDisplay('vendor_returnshipment', false);
	}
}