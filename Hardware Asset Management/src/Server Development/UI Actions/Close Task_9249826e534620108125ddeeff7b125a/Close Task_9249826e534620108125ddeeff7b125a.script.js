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

function processTaskCompletion() {
	g_form.clearMessages();
	var flashColor = '#FFFACD';
	if(NOW.isUsingPolaris) {
        flashColor = "RGB(var(--now-alert--warning--background-color,var(--now-color_alert--warning-0,244,240,191)))";
    }
	var message;
	var mandatoryFields = [];
	var msgParams = [];
	var missingFields = [];
	var taskName = g_form.getValue('task_name');
	switch (taskName) {
	case 'assessment':
		mandatoryFields = ['asset', 'stockroom', 'rma_action', 'vendor'];
		break;
	case 'onsite_repair':
		mandatoryFields = ['asset', 'repair_confirmation'];
		if (g_form.getValue('repair_confirmation') === 'Y') {
			mandatoryFields.push('vendor_rma_number');
		}
		break;
	case 'shipment':
		mandatoryFields = ['asset', 'vendor_rma_number', 'ship_date'];
		break;
	case 'vendor_rma_decision':
		mandatoryFields = ['asset', 'vendor_action'];
		break;
	case 'receive':
		mandatoryFields = ['asset', 'asset_received'];
		if (g_form.getValue('vendor_action') === 'replace' && g_form.getValue('asset_received') === 'Y') {
			mandatoryFields.push('replacement_asset');
		}
		break;
	default:
		mandatoryFields = ['asset'];
		break;
	}
	missingFields = checkIfFieldsEmptyInRecord(mandatoryFields);
	if (missingFields && missingFields.length > 0) {
		missingFields.forEach(function(field) {
			g_form.flash(field, flashColor, 0);
			msgParams.push(g_form.getLabelOf(field));
		});
		message = getMessage('The following mandatory fields are not filled in: {0}');
		g_form.addErrorMessage(formatMessage(message, msgParams.join(', ')));
	} else {
		g_form.setValue('state', '3');
		g_form.submit();
	}
}