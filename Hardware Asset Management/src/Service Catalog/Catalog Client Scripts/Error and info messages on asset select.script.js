function onChange(control, oldValue, newValue, isLoading) {
	if (isLoading || newValue == '') {
		return;
	}

   // Checking if selected asset belongs to any existing refresh order and printing the appropriate error message
   // If the selected asset is not eligible for refresh, printing an info message stating approvals will be required

	var assetId = g_form.getValue('asset');
	var ga = new GlideAjax('HAMZeroTouchAssetRefreshUtilsAJAX');
	ga.addParam('sysparm_name', 'validateAssetSelected');
	ga.addParam('sysparm_assetId', assetId);
	ga.getXMLAnswer(errorMessage);
}

function errorMessage(answer) {

	if (answer) {
		var returnedData = JSON.parse(answer);
		if (returnedData.message != '') {
			g_form.addErrorMessage(returnedData.message);
			g_form.clearValue('asset');
			return;
		}
	}

	var assetRecord = g_form.getReference("asset", printMsg);
}

function printMsg(assetRecord) {

	if(assetRecord.eligible_for_refresh == 'false') {
		g_form.showFieldMsg('asset', getMessage('The asset selected is not eligible for refresh, so approval will be requested'), 'info');
	}
}