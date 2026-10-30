function onLoad() {
	if (g_form.getValue('state') === '3' || g_form.getValue('state') === '4') {
		g_form.setReadOnly('short_description', true);
		g_form.setReadOnly('description', true);
		g_form.setReadOnly('state', true);
		g_form.setReadOnly('assignment_group', true);
		g_form.setReadOnly('assigned_to', true);

		// Drop off task related fields
		g_form.setReadOnly('return_stockroom', true);

		// Ship task related fields
		g_form.setReadOnly('carrier', true);
		g_form.setReadOnly('tracking_number', true);
		g_form.setReadOnly('ship_date', true);
		g_form.setReadOnly('shipping_carrier', true);

		// Pick up task related fields
		g_form.setReadOnly('vendor', true);
		g_form.setReadOnly('vendor_order_id', true);
		g_form.setReadOnly('scheduled_date', true);
		g_form.setReadOnly('pickup_contact', true);
		g_form.setReadOnly('pickup_details', true);

		// Receive task related fields
		g_form.setReadOnly('is_reclaimed', true);
		g_form.setReadOnly('quantity_received', true);

		// Evaluate task related fields
		g_form.setReadOnly('evaluation_status', true);
	}
}