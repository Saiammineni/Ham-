function onSubmit() {
	// If submission happens from pop_up, ignore check
	if (g_scratchpad.ignore_insufficient_stock_warning === true) { return true; }

	// Submission happens from the form and stock is insufficient for waitlist conversion
	if (g_scratchpad.is_stock_insufficient === true) {
		var DialogClass = (typeof GlideModal !== 'undefined') ? GlideModal : GlideDialogWindow; // eslint-disable-line
		var dd = new DialogClass('sn_hamp_loaner_waitlist_stock_warning');
		dd.setTitle(new GwtMessage().getMessage('Insufficient stock : {0}', g_form.getValue('number')));
		/* eslint-disable no-undef */
		assetSetDomainParameters(dd);
		dd.setWidth(400);
		dd.render();

		return false;
	}

	return true;
}
onSubmit();