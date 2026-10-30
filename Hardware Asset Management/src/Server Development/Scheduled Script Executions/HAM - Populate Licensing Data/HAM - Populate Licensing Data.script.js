var C_JOB_NAME = 'HAM - Populate Licensing Data';
var jobSysId = 'dfa67773c7811010f74c784c95c260b5';
var hamUtils = new sn_hamp.HAMUtils();
var licenseUtils = new sn_hamp.HAMLicensingUtility();
var jobLog = new global.AssetJobLogUtil();
function hampPopulateLUAData() {
	jobLog.startJobLog(C_JOB_NAME);
	var isLicensingJobStatusFieldValid = licenseUtils.getIfLicensingJobStatusFieldValid();
	if (hamUtils.isJobRunning(jobSysId)) {
		// If there is already one job running, no need to run the current one
        jobLog.stopJobLog(jobLog.FAILED_STATUS, C_JOB_NAME + ' job is already running');
    } else {
        try {
			licenseUtils.populateAssetUsageData(isLicensingJobStatusFieldValid);
			jobLog.stopJobLog(jobLog.COMPLETED_STATUS, '');
        } catch (error) {
			licenseUtils.deleteUnprocessedLicenseReportData(licenseUtils.JOB_STATUS.IN_PROGRESS,licenseUtils.HAM_APPLICATIONS,isLicensingJobStatusFieldValid);
            jobLog.stopJobLog(jobLog.FAILED_STATUS, error.message);
        }
    }
}
hampPopulateLUAData();