function handleLoanerAssetAvailabilityResponse(response) {
	var answer = JSON.parse(response.responseXML.documentElement.getAttribute('answer'));
	g_form.hideFieldMsg('return_date');
	if (!answer.isAvailable) {
		g_form.showFieldMsg('return_date', answer.message, 'warning');
	}
}

function checkLoanerAssetAvailability() {
	if (g_form.getValue('location') !== ''
		&& g_form.getValue('model') !== ''
		&& g_form.getValue('start_date') !== ''
		&& g_form.getValue('return_date') !== '') {

		var ga = new GlideAjax('sn_hamp.HampLoanerAjaxUtils');
		ga.addParam('sysparm_name', 'isLoanerAssetAvailable');
		ga.addParam('sysparm_location', g_form.getValue('location'));
		ga.addParam('sysparm_model', g_form.getValue('model'));
		ga.addParam('sysparm_lead_time', g_form.getValue('lead_time'));
		ga.addParam('sysparm_start_date', g_form.getValue('start_date'));
		ga.addParam('sysparm_return_date', g_form.getValue('return_date'));
		ga.getXML(handleLoanerAssetAvailabilityResponse);
	}
}

function onChange(control, oldValue, newValue, isLoading) {
	if (isLoading || newValue == '') {
		return;
	}
	checkLoanerAssetAvailability();
}