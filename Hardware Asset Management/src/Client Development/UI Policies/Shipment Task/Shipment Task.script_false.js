function onCondition() {
	g_form.setSectionDisplay('shipment', false);
	g_form.setMandatory('shipping_carrier', false);
	g_form.setMandatory('ship_date', false);
	g_form.setMandatory('tracking_number', false);
}