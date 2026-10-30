function check () {
	g_form.setMandatory('asset', false);
	g_form.setMandatory('scheduled_date', false);
	gsftSubmit(null, g_form.getFormElement(), 'cancel_refresh_line');
}

function cancelRefreshLine () {
	var assetRefreshUtils = new HAMAssetRefreshUtils();
	assetRefreshUtils.markActiveTaskClosedIncomplete(current.sys_id);
	current.update();
	action.setRedirectURL(current);
}

if (typeof window === 'undefined') { cancelRefreshLine(); }