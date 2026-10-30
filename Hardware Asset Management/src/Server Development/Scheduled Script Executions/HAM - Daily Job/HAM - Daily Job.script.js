var jobLog = new global.AssetJobLogUtil();

function updateModelCategoryCount(){
	if (sn_hamp.HAMUtils.isZTMOnlyInstance()) {
		return;
	}
	var stepMessage='Calculate number of Hardware and consumable models for each Model category';
	jobLog.startJobStep(stepMessage);
	new sn_hamp.HAMUpdateModelCategoryCount().updateModelCategoryCount();
	jobLog.stopJobStep(stepMessage);
}

function updateActiveLifecyclePhase(){
	var stepMessage='Calculate active lifecycle phase for models';
	jobLog.startJobStep(stepMessage);
	new sn_hamp.HAMHWModelLifecycleAPI().updateActiveLifecyclePhase();
	jobLog.stopJobStep(stepMessage);
}

function setClientPullSchedules() {
	if (sn_hamp.HAMUtils.isZTMOnlyInstance()) {
		return;
	}
	var stepMessage = 'Set Client Schedule Pull-Time';
	jobLog.startJobStep(stepMessage);
	new sn_hamp.HAMSetClientSchedulePullTime().process();
	jobLog.stopJobStep(stepMessage);
}

function runDailyJob() {
	jobLog.startJobLog('HAM - Daily Job');
	var HAMUtils = new sn_hamp.HAMUtils();
	if (HAMUtils.isJobRunning('3df6b4a453d01010249addeeff7b12a9')) {
		gs.info('HAM - Daily Job is already running');
		jobLog.stopJobLog(HAMConstants.JOB_STATUSES.COMPLETED, 'HAM - Daily Job is already running');
	}
	else {
		var errorArray = [];

		// List of function which run in daily job.
		functionList = [setClientPullSchedules, updateActiveLifecyclePhase, updateModelCategoryCount];
		functionList.forEach(function(fn) {
			try {
				fn();
			} catch(error) {
				errorArray.push(error.message);
			}
		});
		if(errorArray.length > 0) {
			jobLog.stopJobLog(HAMConstants.JOB_STATUSES.FAILED, errorArray.join(', '));
		} else {
			jobLog.stopJobLog(HAMConstants.JOB_STATUSES.COMPLETED, 'HAM - Daily Job completed');
		}
	}
}

runDailyJob();
