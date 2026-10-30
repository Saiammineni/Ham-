function onSubmit() {
	// If submission happens from pop_up, ignore check
	if (g_scratchpad.ignore_insufficient_stock_warning === true) { return true; }
	// Submission happens from the form and stock is insufficient for waitlist conversion
	if (g_scratchpad.is_stock_insufficient === true) {
		var loanerOrderNumber = g_form.getValue('number');
		var model = g_form.getValue('model');
		var asset = g_form.getValue('asset');
		var workNotes = g_form.getValue('work_notes');
		var str = getMessage('Insufficient stock : {0}', loanerOrderNumber);
		var heading = format(str, { 0: loanerOrderNumber });
		var title = heading;
		var msg = getMessage('There is no available stock to fulfill this request if removed from the waitlist.  Do you wish to proceed?');// eslint-disable-line
		var cancelLabel = getMessage('Cancel');
		var confirmationLabel = getMessage('OK');
		var multipleFieldChanges = false;
		if(model !== g_scratchpad.model || asset !== g_scratchpad.asset || workNotes !== g_scratchpad.work_notes) {
			multipleFieldChanges = true;
		}
		g_modal.confirm(
			title,
			msg,
			function(response) {
				if (response) {
					g_scratchpad.ignore_insufficient_stock_warning = true;
					g_form.save();
				} else {
					g_form.setValue('is_waitlisted', true);
					if(!multipleFieldChanges) {
						g_form.save();
					}
				}
			}, {
				cancelTitle: cancelLabel,
				confirmTitle: confirmationLabel,
			}
		);
		return false;
	}

	return true;
}
onSubmit();