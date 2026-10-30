function openReplaceAssetsModal() {
	/* global assetSetDomainParameters */
	var DialogClass = GlideModal || GlideDialogWindow;
	var gm = new DialogClass('sn_hamp_bundle_replace_assets');

	// Sets the dialog title
	gm.setTitle(getMessage('Replace assets'));
	gm.setPreference('sysparm_sys_id', g_form.getUniqueValue());
	gm.setPreference('sysparm_stockroom', g_form.getValue('stockroom'));
	assetSetDomainParameters(gm);
	gm.setWidth(700);
	// Opens the dialog
	gm.render();
}