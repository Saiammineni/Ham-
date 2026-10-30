function onChange(control, oldValue, newValue, isLoading, isTemplate) {
	if (isLoading || newValue === '') {
		return;
	}

	function handleCanReplaceAssetResponse(response) {
		var answer = JSON.parse(response.responseXML.documentElement.getAttribute('answer'));
		g_scratchpad.can_replace_asset = answer.canReplace;
	}

	if (g_scratchpad.can_replace_asset !== 'not_applicable') {
		var ga = new GlideAjax('sn_hamp.HAMRMAAjaxUtils');
		ga.addParam('sysparm_name', 'canReplaceAsset');
		ga.addParam('sysparm_asset', g_form.getValue('asset'));
		ga.addParam('sysparm_replacement_asset', g_form.getValue('replacement_asset'));
		ga.getXML(handleCanReplaceAssetResponse);
	}
}