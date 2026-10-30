function onSubmit() { // eslint-disable-line
	if (g_scratchpad.can_replace_asset === 'not_applicable' || g_form.getValue('state') !== '3') {
		return true;
	}

	// If submission happens from pop_up, ignore check
	if (g_scratchpad.ignore_can_replace_warning === true) {
		return true;
	}
	function onOk(fromWorkspace) {
		g_scratchpad.ignore_can_replace_warning = true;
		if (fromWorkspace) {
			return g_form.save();
		}
		return g_form.submit();
	}
	function onCancel() { }

	if (g_scratchpad.can_replace_asset === 'false') {
		//	if submission happens through workspace g_modal is used to show the pop-up
		if (g_form.getViewName() === 'workspace') {
			// eslint-disable-next-line max-len
			var msg = getMessage('Model of selected replacement asset does not match with the model of asset. Asset will be released from the bundle. Bundle will be moved to Build status.');
			g_modal.confirm(getMessage('Confirm asset release'), msg, function (ret) { // eslint-disable-line
				if (ret) {
					onOk(true /* fromWorkspace */);
				}
			});
		} else {
			var DialogClass = (typeof GlideModal !== 'undefined') ? GlideModal : GlideDialogWindow; // eslint-disable-line
			var dd = new DialogClass('sn_hamp_rma_asset_release_warning');
			dd.setTitle(new GwtMessage().getMessage('Confirm asset release'));
			dd.setPreference('onOk', onOk);
			dd.setPreference('onCancel', onCancel);
			/* eslint-disable no-undef */
			assetSetDomainParameters(dd);
			dd.setWidth(400);
			dd.render();
		}
		return false;
	}
	return true;
}