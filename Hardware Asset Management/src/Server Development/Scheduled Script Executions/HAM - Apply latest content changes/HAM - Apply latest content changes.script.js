(function(){
	_processContentUpdate();
	
	function _processContentUpdate() {
		var hamUtils = new sn_hamp.HAMUtils();
		if (!hamUtils.isJobRunning('bdf6b4a453d01010249addeeff7b12a9')) {
			// hwnorm2hamp var params = global.HAMUpdateHandler.JOB_PARAMS;
			var params = sn_hamp.HAMUpdateHandler.JOB_PARAMS;
			params.jobName = 'HAM - Apply latest content changes';
			new global.ContentUpdateAPI(params).runJob();
		}
	}
})();