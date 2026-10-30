function onChange(control, oldValue, newValue, isLoading, isTemplate) {
	if (isLoading || newValue === '') {
		return;
	}

	var dateAdded = g_form.getValue('added');
	var dateRemoved = g_form.getValue('removed');

	if (dateAdded === '' || dateRemoved === '') {
		return;
	}

	if (dateAdded && dateRemoved) {
		var validateDates = new GlideAjax('HAMContractManagementAjaxUtils');
		validateDates.addParam('sysparm_name', 'compareDate');
		validateDates.addParam('sysparm_start_date', dateAdded + ' 00:00:00');
		validateDates.addParam('sysparm_start_date_label', g_form.getLabelOf('added'));
		validateDates.addParam('sysparm_end_date', dateRemoved + ' 00:00:00');
		validateDates.addParam('sysparm_end_date_label', g_form.getLabelOf('removed'));
		validateDates.getXML(function(response) {
			var answer = response.responseXML.documentElement.getAttribute('answer');
			if (answer) {
				g_form.clearValue('removed');
				g_form.showFieldMsg('removed', answer, 'error');
			}
		});
	}
}