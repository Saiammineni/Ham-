function onChange(control, oldValue, newValue, isLoading, isTemplate) {
	if (isLoading || newValue === '') {
		return;
	}

	// notification date must be between
	// contract start and end dates

	var notificationDate = g_form.getValue('notification_date');
	var startDate = g_form.getValue('starts');
	var endDate = g_form.getValue('ends');

	if (startDate && endDate && notificationDate) {
		var validateDates = new GlideAjax('HAMContractManagementAjaxUtils');
		validateDates.addParam('sysparm_name', 'validateStartTargetEndDate');
		validateDates.addParam('sysparm_start_date', startDate + ' 00:00:00');
		validateDates.addParam('sysparm_start_date_label', g_form.getLabelOf('starts'));
		validateDates.addParam('sysparm_end_date', endDate + ' 00:00:00');
		validateDates.addParam('sysparm_end_date_label', g_form.getLabelOf('ends'));
		validateDates.addParam('sysparm_target_date', notificationDate + ' 00:00:00');
		validateDates.addParam('sysparm_target_date_label', g_form.getLabelOf('notification_date'));
		validateDates.getXML(function(response) {
			var answer = response.responseXML.documentElement.getAttribute('answer');
			if (answer) {
				g_form.clearValue('notification_date');
				g_form.showFieldMsg('notification_date', answer, 'error');
			}
		});
	}
}