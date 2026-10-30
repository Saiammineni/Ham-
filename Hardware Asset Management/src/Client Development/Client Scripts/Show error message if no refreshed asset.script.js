function onLoad() {
   //Type appropriate comment here, and begin script below
   if((g_form.getValue('stage') == 'pending_receive' || g_form.getValue('stage') == 'pending_evaluation' || g_form.getValue('stage') == 'closed_complete') && (g_form.getValue('refreshed_asset') == ''))  {
			var requestId = g_form.getUniqueValue();
			var ga = new GlideAjax('HAMZeroTouchAssetRefreshUtilsAJAX');
			ga.addParam('sysparm_name', 'validateRefreshedAsset');
			ga.addParam('sysparm_requestId', requestId);
			ga.getXMLAnswer(errorMessage);
		}
}

function errorMessage(answer) {
	
	if (answer) {
		var returnedData = JSON.parse(answer);
		if (returnedData.message != '') {
			g_form.addErrorMessage(returnedData.message);
			return;
		}
	}
}