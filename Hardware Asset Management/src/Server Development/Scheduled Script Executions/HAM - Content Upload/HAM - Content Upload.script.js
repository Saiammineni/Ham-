runHAMContent();
function runHAMContent() {
	var hamUtils = new sn_hamp.HAMUtils();
	if (hamUtils.isJobRunning(sn_hamp.HAMConstants.CONTENT_UPLOAD_JOB_ID)) {
		gs.info('HAM - Content Upload job is already running');
		return;
	}

	new sn_hamp.HAMContentAPI().runJob();
}