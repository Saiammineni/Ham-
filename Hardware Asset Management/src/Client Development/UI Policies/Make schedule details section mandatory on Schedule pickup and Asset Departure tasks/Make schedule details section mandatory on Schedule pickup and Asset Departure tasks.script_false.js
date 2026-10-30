function onCondition() {
	if (g_form.getValue('task_name') === 'depart') {
		g_form.setMandatory('hardware_disposal.vendor_order_id', false);
		g_form.setMandatory('hardware_disposal.pickup_contact', false);
	}
}