var HAMSetClientSchedulePullTime = Class.create();
HAMSetClientSchedulePullTime.prototype = {
	initialize: function() {
		this.CDSTablesToDownload = [];
		this.offsetTimes = [];
		this.fRandomizeCDSClientScheduleTables = new global.RandomizeCDSClientScheduleTables();
	},

	process: function() {
		if (this.setCDSDownloadJobRunTime()) {
			this.setContentSyncJobRunTime(sn_hamp.HAMConstants.CONTENT_SYNC_JOB_ID, 120);
		}
	},

	setCDSDownloadJobRunTime: function() {
		var HamCDSTablesToDownload = [HAMConstants.CONTENT_TABLES.HW_MANUFACTURER, HAMConstants.CONTENT_TABLES.DEVICE_TYPE,
			HAMConstants.CONTENT_TABLES.HW_PRODUCT, HAMConstants.CONTENT_TABLES.HW_PRODUCT_MODEL,
			HAMConstants.CONTENT_TABLES.HW_LIFECYCLE_DEFINITION, HAMConstants.CONTENT_TABLES.HW_NORMALIZATION_MAP, HAMConstants.CONTENT_TABLES.HW_MATURITY_CONTENT];
		var HamOffsetTimes = [3, 3, 10, 15, 15, 3];
		this.CDSTablesToDownload.push.apply(this.CDSTablesToDownload, HamCDSTablesToDownload);
		this.offsetTimes.push.apply(this.offsetTimes, HamOffsetTimes);

		var clientSchedule = new GlideRecord('cds_client_schedule');
		clientSchedule.addQuery('table.table', this.CDSTablesToDownload);
		clientSchedule.addQuery('active', false);
		clientSchedule.setLimit(1);
		clientSchedule.query();
		if (!clientSchedule.hasNext()) {
			return false;
		}
		this.fRandomizeCDSClientScheduleTables.process(this.CDSTablesToDownload, this.offsetTimes);
		return true;
	},

	_generateRunTime: function (newRunTimeHrs, newRunTimeMin, newRunTimeSec) {
		return newRunTimeHrs + ':' + newRunTimeMin + ':' + newRunTimeSec;
	},

	setContentSyncJobRunTime: function(jobId, offset) {
		var prevClientScheduleTable = new GlideRecord('cds_client_schedule');
		prevClientScheduleTable.addQuery('table.table', this.CDSTablesToDownload[this.CDSTablesToDownload.length - 1]);
		prevClientScheduleTable.query();
		if (prevClientScheduleTable.next()) {
			var prevRunTime = prevClientScheduleTable.getValue('run_time');
			var prevDayOfWeek = prevClientScheduleTable.getValue('run_dayofweek');
			var dayTimeSplit = prevRunTime.split(' ');
			var runTime = dayTimeSplit[1].split(':');
			var newRunTimeHours = Number(runTime[0]);
			var newRunTimeMinutes = Number(runTime[1]) + parseInt(offset);
			if (newRunTimeMinutes >= 60) {
				newRunTimeHours += parseInt(newRunTimeMinutes / 60);
				newRunTimeMinutes %= 60;
			}
			if (newRunTimeHours >= 24) {
				prevDayOfWeek = parseInt(prevDayOfWeek) + parseInt(newRunTimeHours / 24);
				newRunTimeHours %= 24;
				if (prevDayOfWeek >= 8) {
					prevDayOfWeek -= 7;
				}
			}
			var finalRunTime = this._generateRunTime(newRunTimeHours, newRunTimeMinutes, Number(runTime[2]));

			var scheduledJobGr = new GlideRecord('sysauto_script');
			scheduledJobGr.addQuery('sys_id', jobId);
			scheduledJobGr.query();
			if (scheduledJobGr.next()) {
				scheduledJobGr.setValue('run_type', 'weekly');
				scheduledJobGr.setValue('run_time', finalRunTime);
				scheduledJobGr.setValue('run_dayofweek', prevDayOfWeek + '');
				scheduledJobGr.setValue('active', true);
				scheduledJobGr.update();
			}
		}
	},

	type: 'HAMSetClientSchedulePullTime',
};