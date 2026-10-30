function onLoad() {
	//Type appropriate comment here, and begin script below
	g_form.setReadOnly('zero_touch_req.tracking_number', true);
	g_form.setReadOnly('zero_touch_req.carrier', true);
	g_form.setReadOnly('zero_touch_req.return_tracking_number', true);
	g_form.setReadOnly('zero_touch_req.return_carrier', true);
	var state = g_form.getValue('state');
	var taskName = g_form.getValue('task_name');
	if (taskName === 'request_shipment' && (state === '1' || state === '2')) {
		g_form.setMandatory('zero_touch_req.tracking_number', true);
		g_form.setMandatory('zero_touch_req.carrier', true);
		g_form.setMandatory('zero_touch_req.return_tracking_number', true);
		g_form.setMandatory('zero_touch_req.return_carrier', true);
	} else {
		g_form.setMandatory('zero_touch_req.tracking_number', false);
		g_form.setMandatory('zero_touch_req.carrier', false);
		g_form.setMandatory('zero_touch_req.return_tracking_number', false);
		g_form.setMandatory('zero_touch_req.return_carrier', false);
	}	
}