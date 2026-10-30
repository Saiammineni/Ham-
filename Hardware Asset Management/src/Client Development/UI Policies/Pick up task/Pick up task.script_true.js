function onCondition() {
	g_form.setSectionDisplay('pick_up', true);
	g_form.setMandatory('vendor', true);
	g_form.setMandatory('vendor_order_id', true);
	g_form.setMandatory('scheduled_date', true);
	g_form.setMandatory('pickup_contact', true);
}