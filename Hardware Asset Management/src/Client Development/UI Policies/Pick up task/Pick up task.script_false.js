function onCondition() {
	g_form.setSectionDisplay('pick_up', false);
	g_form.setMandatory('vendor', false);
	g_form.setMandatory('vendor_order_id', false);
	g_form.setMandatory('scheduled_date', false);
	g_form.setMandatory('pickup_contact', false);
}