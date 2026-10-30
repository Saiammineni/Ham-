var HAMContractManagementAjaxUtils = Class.create();
HAMContractManagementAjaxUtils.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {
	validateStartTargetEndDate: function() {
		var startDate = this.getParameter('sysparm_start_date');
		var endDate = this.getParameter('sysparm_end_date');
		var targetDate = this.getParameter('sysparm_target_date');
		var startDateLabel = this.getParameter('sysparm_start_date_label');
		var endDateLabel = this.getParameter('sysparm_end_date_label');
		var targetDateLabel = this.getParameter('sysparm_target_date_label');

		if (!startDate || !endDate || !targetDate) {
			return '';
		}

		startDate = HAMUtils.getDateInInternalFormat(startDate);
		endDate = HAMUtils.getDateInInternalFormat(endDate);
		targetDate = HAMUtils.getDateInInternalFormat(targetDate);
		if (startDate > targetDate) {
			return gs.getMessage('{0} must be between {1} and {2}', [targetDateLabel, startDateLabel, endDateLabel]);
		}
		if (targetDate > endDate) {
			return gs.getMessage('{0} must be between {1} and {2}', [targetDateLabel, startDateLabel, endDateLabel]);
		}
		return '';
	},
	compareDate: function() {
		var startDate = this.getParameter('sysparm_start_date');
		var endDate = this.getParameter('sysparm_end_date');
		var startDateLabel = this.getParameter('sysparm_start_date_label');
		var endDateLabel = this.getParameter('sysparm_end_date_label');

		if (!startDate || !endDate) {
			return '';
		}

		startDate = HAMUtils.getDateInInternalFormat(startDate);
		endDate = HAMUtils.getDateInInternalFormat(endDate);
		if (startDate > endDate) {
			return gs.getMessage('{0} must be before {1}', [startDateLabel, endDateLabel]);
		}
		return '';
	},
	type: 'HAMContractManagementAjaxUtils',
});