function onClick(g_form) {
	function checkIfFieldsEmptyInRecord(fields) {
		var missingFields = [];
		if (fields && fields.length > 0) {
			fields.forEach(function(field) {
				if (!g_form.getValue(field)) {
					missingFields.push(field);
				}
			});
		}
		return missingFields;
	}
	g_form.clearMessages();
	if (g_form.getValue('state') === '4') {
		g_form.save();
		return;
	}
	var message;
	var mandatoryFields = [];
	var msgParams = [];
	var missingFields = [];
	var taskName = g_form.getValue('task_name');
	switch (taskName) {
	case 'schedule':
		mandatoryFields = ['hardware_disposal.scheduled_date', 'hardware_disposal.vendor'];
		break;
	case 'depart':
		mandatoryFields = ['hardware_disposal.scheduled_date', 'hardware_disposal.vendor', 'hardware_disposal.vendor_order_id', 'hardware_disposal.pickup_contact'];
		break;
	default:
	}
	if (mandatoryFields && mandatoryFields.length > 0)
		missingFields = checkIfFieldsEmptyInRecord(mandatoryFields);
	if (missingFields && missingFields.length > 0) {
		missingFields.forEach(function(field) {
			msgParams.push(g_form.getLabelOf(field));
		});
		message = getMessage('The following mandatory fields are not filled in: {0}');
		g_form.addErrorMessage(message.replace(new RegExp( '\\{0\\}', 'g' ), msgParams.join(', ')));
	} else {
		g_form.setValue('state', '3');
		g_form.save();		
	}
}