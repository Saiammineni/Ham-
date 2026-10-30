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
    var startDate;
    var returnDate;

    function callback(response) {
        var msg;
        var answer = JSON.parse(response.responseXML.documentElement.getAttribute("answer"));
        if (answer['isStartDateValid'] == false) {
            g_form.clearValue('start_date');
            msg = answer['startDateErrorMsg'];
            g_form.showFieldMsg('start_date', msg, 'error');
        } else if (answer['isReturnDateValid'] == false) {
            g_form.clearValue('return_date');
			msg = answer['returnDateErrorMsg'];
            g_form.showFieldMsg('return_date', msg, 'error');
        }
		checkLoanerAssetAvailability();
    }
    if (isLoading || newValue == '') {
        return;
    }
    startDate = g_form.getValue('start_date');
    returnDate = g_form.getValue('return_date');
    var ga = new GlideAjax('sn_hamp.HampLoanerAjaxUtils');
    ga.addParam('sysparm_name', 'validateDates');
    ga.addParam('sysparm_startdate', startDate);
    ga.addParam('sysparm_returndate', returnDate);
    ga.getXML(callback);
}