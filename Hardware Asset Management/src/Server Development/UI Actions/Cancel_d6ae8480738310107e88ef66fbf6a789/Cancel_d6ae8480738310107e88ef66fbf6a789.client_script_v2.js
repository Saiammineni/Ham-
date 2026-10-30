function onClick(g_form) {
	var loanerAssetNumber = g_form.getValue('number');
	var loanerAssetId = g_form.getUniqueValue();
	var titleMessage = getMessage('Cancel Order : {0}');
	var title = format(titleMessage, {0: loanerAssetNumber});
	
	function doCancel() {
		var ga = new GlideAjax('sn_hamp.HampLoanerAjaxUtils');
		ga.addParam('sysparm_name', 'cancelLoanerAsset');
		ga.addParam('sysparm_loaner_asset', loanerAssetId);
		ga.setScope('sn_hamp');
		ga.getXML(parseResponse);
	}

	function parseResponse() {
		g_form.reload();
	}
	
	var msg = getMessage('Are you sure you want to cancel this order?');
	var cancelLabel = getMessage('Cancel');
	var cancelConfirmationLabel = getMessage('OK');
	g_modal.confirm(
		title,
		msg,
		function (response) {
			if (response) {
				doCancel();
			}
		},
		{
			cancelTitle: cancelLabel,
			confirmTitle: cancelConfirmationLabel,
		}
	);
}