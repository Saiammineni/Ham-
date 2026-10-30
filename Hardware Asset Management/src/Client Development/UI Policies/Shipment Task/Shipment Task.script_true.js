function onCondition() {
	g_form.setSectionDisplay('shipment', true);
	g_form.setMandatory('shipping_carrier', true);
	g_form.setMandatory('ship_date', true);
	g_form.setMandatory('tracking_number', true);
}