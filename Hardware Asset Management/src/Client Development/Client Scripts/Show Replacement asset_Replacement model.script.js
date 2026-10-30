function onLoad() {
	var stage = g_form.getValue('stage');
	var vendorAction = g_form.getValue('vendor_action');
	if (stage === 'completed' && vendorAction === 'replace') {
		var replacementAsset = g_form.getValue('replacement_asset');
		if (replacementAsset) {
			g_form.setDisplay('replacement_model', false);
		} else {
			g_form.setDisplay('replacement_asset', false);
		}
	} else {
		g_form.setDisplay('replacement_asset', false);
		g_form.setDisplay('replacement_model', false);
	}
}