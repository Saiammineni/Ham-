function onChange(control, oldValue, newValue, isLoading, isTemplate) {
	if (isLoading || newValue === '') { return; }

	function handleLoanerAssetAvailabilityResponse(response) {
		var answer = JSON.parse(response.responseXML.documentElement.getAttribute('answer'));
		g_scratchpad.is_stock_insufficient = !answer.isAvailable;
	}

	if (oldValue === 'true' && newValue === 'false') {
		var ga = new GlideAjax('sn_hamp.HampLoanerAjaxUtils');
		ga.addParam('sysparm_name', 'isLoanerAssetAvailable');
		ga.addParam('sysparm_location', g_form.getValue('location'));
		ga.addParam('sysparm_model', g_form.getValue('model'));
		ga.addParam('sysparm_lead_time', g_scratchpad.lead_time);
		ga.addParam('sysparm_start_date', g_form.getValue('start_date'));
		ga.addParam('sysparm_return_date', g_form.getValue('return_date'));
		ga.getXML(handleLoanerAssetAvailabilityResponse);
	} else {
		g_scratchpad.is_stock_insufficient = null;
	}
}