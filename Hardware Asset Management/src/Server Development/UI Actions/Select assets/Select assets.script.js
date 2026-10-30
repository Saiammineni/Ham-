function openSelectModal() {
	/* global assetSetDomainParameters */
	var DialogClass = GlideModal || GlideDialogWindow;
	var gm = new DialogClass('sn_hamp_bundle_select_assets');
	// Sets the dialog title
	gm.setTitle(getMessage('Select assets for a bundle'));
	gm.setPreference('sysparm_sys_id', g_form.getUniqueValue());
	gm.setPreference('sysparm_stockroom', g_form.getValue('stockroom'));
	// to pass domain params
	assetSetDomainParameters(gm);
	gm.setWidth(700);
	// Opens the dialog
	gm.render();
}
