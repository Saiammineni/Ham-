function processAssetChange(asset) {

	var processAssetExclusionMessage = function(response) {
		var result = JSON.parse(response.responseXML.documentElement.getAttribute('answer'));
		if (result.isExcluded === 'true') {
			g_form.addErrorMessage(result.message);
			g_form.clearValue('asset');
		}
	};

	var quantityAssetClasses = ['alm_consumable'];
	var assetClass = asset.sys_class_name.toString();
	var isDuplicate = false;

	// DEF0359592 - get message from server.
	// Message contains asset display name and Service portal does not support GwtMesage 
	// When an asset is selected, check if it is excluded from HAM flows
	var ga = new GlideAjax('sn_hamp.HAMRMAAjaxUtils');
	ga.addParam('sysparm_name', 'showMessageIfAssetExcluded');
	ga.addParam('sysparm_sysId', asset.getValue('sys_id'));
	ga.getXML(processAssetExclusionMessage);

	// In case of non-consumable assets, check for duplicate entry
	// In case of consumables, check quantity
	var selectedAssets = [];
	if (g_service_catalog.parent.getValue('rma_assets')) {
		selectedAssets = JSON.parse(g_service_catalog.parent.getValue('rma_assets'));
	}
	if (quantityAssetClasses.indexOf(assetClass) !== -1) {
		var quantitySelected = 0;
		selectedAssets.forEach(function(assetObj) {
			if (assetObj.asset === asset.getValue('sys_id')) {
				quantitySelected += parseInt(assetObj.quantity);
			}
		});
		var totalQuantity = parseInt(asset.getValue('quantity'));
		if (quantitySelected > 0 && quantitySelected >= totalQuantity) {
			g_form.setVisible('quantity', false);
			g_form.addErrorMessage(getMessage('Asset has already been added to this order'));
			g_form.clearValue('asset');
		} else {
			g_form.setVisible('quantity', true);
			g_form.setValue('quantity', 1);
			g_form.showFieldMsg('quantity',
				getMessage('Quantity can be modified for selected asset type'),
				'info');
		}
	} else {
		isDuplicate = selectedAssets.some(function(assetObj) {
			return assetObj.asset === asset.getValue('sys_id');
		});
		if (isDuplicate === true) {
			g_form.addErrorMessage(getMessage('Asset has already been added to this order'));
			g_form.clearValue('asset');
		} else {
			g_form.setValue('quantity', 1);
		}
		g_form.setVisible('quantity', false);
	}
}
function onChange(control, oldValue, newValue, isLoading) {
	if (isLoading || newValue == '') {
		return;
	}
	g_form.hideAllFieldMsgs('info');
	g_form.clearMessages();
	g_form.getReference('asset', processAssetChange);
}