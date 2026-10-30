function onChange(control, oldValue, newValue, isLoading, isTemplate) {
	function showDateMessages(infoMessage) {
		if (g_form.isNewRecord() && newValue === '') {
			g_form.showFieldMsg('scheduled_date', infoMessage, 'info');
			return;
		}
		var ga = new GlideAjax('sn_hamp.AssetAuditDateUtils');
		ga.addParam('sysparm_name', 'diffFromNow');
		ga.addParam('sysparm_scheduled_date', newValue);

		function DateDiffParse(response) {
			var answer = response.responseXML.documentElement.getAttribute('answer');
			function validateDate(errorMessage) {
				if (g_form.isNewRecord()) {
					if (answer < 0) {
						g_form.showFieldMsg('scheduled_date', errorMessage, 'error');
					} else {
						g_form.showFieldMsg('scheduled_date', infoMessage, 'info');
					}
				}
			}
			getMessage('You have chosen a date in the past. Choose today or a date in the future.', validateDate);
		}
		ga.getXML(DateDiffParse);
	}
	getMessage('This field is for scheduled audits. Please choose today or a date in the future.', showDateMessages);
}