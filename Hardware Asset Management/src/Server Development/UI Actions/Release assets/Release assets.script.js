/* global assetSetDomainParameters */
function openReleaseAssetsModal() {
	var DialogClass = GlideModal || GlideDialogWindow;
	var gm = new DialogClass('sn_hamp_bundle_asset_release');
	gm.setTitle(getMessage('Confirmation'));
	gm.setPreference('sysparm_sys_id', g_form.getUniqueValue());
	assetSetDomainParameters(gm);
	gm.setWidth(400);
	gm.render();
}