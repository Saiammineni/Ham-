function onLoad() {
	var taskName = g_form.getValue('task_name');
	// Show shipment section when task is Shipment
	if (taskName !== 'lease_shipment') { g_form.setSectionDisplay('shipment', false); }
	// Show Asset collection section when task is Collection
	if (taskName !== 'lease_collection') { g_form.setSectionDisplay('asset_collection', false); }
	// Show Buyout details section when task is Buyout or Buyout Confirmation
	if (!(taskName === 'lease_buyout' || taskName === 'lease_buyout_confirmation')) {
		g_form.setSectionDisplay('buyout_details', false);
	}
	// Show Extension details section when task is Extension or Extension Confirmation
	if (!(taskName === 'lease_extension' || taskName === 'lease_extension_confirmation')) {
		g_form.setSectionDisplay('extension_details', false);
	}
	// Show Return details section task is Return Confirmation or Lease Return Settlement
	if (!(taskName === 'lease_return_confirmation' || taskName === 'lease_return_settlement')) {
		g_form.setSectionDisplay('return_details', false);
	}
}