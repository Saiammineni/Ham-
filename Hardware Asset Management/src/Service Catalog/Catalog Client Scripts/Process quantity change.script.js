var oldQuanity;

function processQuantityChange(asset) {
	var assetQuantity = parseInt(asset.quantity);
	var quantity = parseInt(g_form.getValue('quantity'));
	quantity -= oldQuanity;
	if (g_service_catalog.parent.getValue('rma_assets')) {
		var selectedAssets = JSON.parse(g_service_catalog.parent.getValue('rma_assets'));
		selectedAssets.forEach(function(assetObj) {
			if (assetObj.asset === asset.getValue('sys_id')) {
				quantity += parseInt(assetObj.quantity);
			}
		});
	}
	if (quantity > assetQuantity) {
		g_form.addErrorMessage(getMessage('Quantity cannot exceed available asset quantity'));
		g_form.clearValue('quantity');
	}
}

function onChange(control, oldValue, newValue, isLoading) {
	if (isLoading || newValue == '') {
		return;
	}
	oldQuanity = oldValue;
	g_form.hideAllFieldMsgs('info');
	g_form.clearMessages();
	g_form.getReference('asset', processQuantityChange);
}