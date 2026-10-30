function onLoad() {
	// Following fiels are set as read-only
	g_form.setReadOnly('number', true);
	g_form.setReadOnly('zero_touch_req', true);
	g_form.setReadOnly('state', true);
	// Shipment
	g_form.setReadOnly('zero_touch_req.name', true); 
	g_form.setReadOnly('zero_touch_req.email', true);
	g_form.setReadOnly('zero_touch_req.mobile', true);
	g_form.setReadOnly('zero_touch_req.street', true); 
	g_form.setReadOnly('zero_touch_req.city', true);
	g_form.setReadOnly('zero_touch_req.state_loc', true);
	g_form.setReadOnly('zero_touch_req.country', true);
	g_form.setReadOnly('zero_touch_req.zip', true);
	g_form.setReadOnly('zero_touch_req.tracking_number', true);
	g_form.setReadOnly('zero_touch_req.carrier', true);
	// Return Shipment
	g_form.setReadOnly('zero_touch_req.return_stockroom.manager.name', true);
	g_form.setReadOnly('zero_touch_req.return_stockroom.location.street', true);
	g_form.setReadOnly('zero_touch_req.return_stockroom.location.city', true);
	g_form.setReadOnly('zero_touch_req.return_stockroom.location.state', true);
	g_form.setReadOnly('zero_touch_req.return_stockroom.location.country', true);
	g_form.setReadOnly('zero_touch_req.return_stockroom.location.zip', true);
	g_form.setReadOnly('zero_touch_req.return_tracking_number', true);
	g_form.setReadOnly('zero_touch_req.return_carrier', true);
	g_form.setDisplay('zero_touch_req.asset', false);
	g_form.setDisplay('zero_touch_req.refreshed_asset', false);
	g_form.setDisplay('evaluation_status', false);
	g_form.setDisplay('zero_touch_req.requested_for', false);
	g_form.setSectionDisplay('shipment', false);
	g_form.setSectionDisplay('return_shipment', false);
	var state = g_form.getValue('state');
	var taskName = g_form.getValue('task_name');
	var hasInventoryRole = g_user.hasRole('inventory_user');
	var hasAssetRole = g_user.hasRole('asset');
	var userRequested = g_form.getValue('zero_touch_req.requested_for');
	switch (taskName) {
	case 'request_shipment':
		g_form.setSectionDisplay('shipment', true);
		g_form.setSectionDisplay('return_shipment', true);
		g_form.setDisplay('zero_touch_req.refreshed_asset', true);
		break;
	case 'ready_for_pickup':
		g_form.setSectionDisplay('shipment', true);
		g_form.setDisplay('zero_touch_req.refreshed_asset', true);
		if (hasInventoryRole) {
			g_form.setReadOnly('state', false);
		}
		break;
	case 'receive_asset':
		g_form.setSectionDisplay('shipment', true);
		g_form.setSectionDisplay('return_shipment', true);
		g_form.setDisplay('zero_touch_req.refreshed_asset', true);
		if (userRequested === g_user.getUserID() || hasAssetRole) {
			g_form.setReadOnly('state', false);
		}
		break;
	case 'receive_return_asset':
		g_form.setSectionDisplay('return_shipment', true);
		g_form.setDisplay('zero_touch_req.asset', true);
		if (hasInventoryRole) {
			g_form.setReadOnly('state', false);
		}
		break;
	case 'asset_evaluation':
		g_form.setDisplay('zero_touch_req.asset', true);
		g_form.setDisplay('evaluation_status', true);
		if (hasInventoryRole) {
			g_form.setReadOnly('state', false);
		}
		if ((state === '1' || state === '2') && hasInventoryRole){
			g_form.setMandatory('evaluation_status', true);
		} else {
			g_form.setReadOnly('evaluation_status', true);
		}
		break;
	default:
		// Request Confirmation
		break;
	}

	if (state === '3'){
		g_form.setReadOnly('state', true);
		g_form.setReadOnly('short_description', true);
		g_form.setReadOnly('description', true);
	}

	if (state !== '4'){
		g_form.removeOption('state', '4');
	}
	
}