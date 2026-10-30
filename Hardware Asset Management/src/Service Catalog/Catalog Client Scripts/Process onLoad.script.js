function verifyAsset(asset) {
	var quantityAssetClasses = ['alm_consumable'];
	var assetClass = asset.sys_class_name.toString();
	if (quantityAssetClasses.indexOf(assetClass) !== -1) {
		g_form.setVisible('quantity', true);
	} else {
		g_form.setVisible('quantity', false);
	}
}

function onLoad() {
	if (!g_form.getValue('asset')) {
		g_form.setVisible('quantity', false);
	} else {
		g_form.getReference('asset', verifyAsset);
	}
}