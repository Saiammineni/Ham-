
runHardwareNormalization();

function runHardwareNormalization() {
	var hamUtils = new sn_hamp.HAMUtils();
	if (hamUtils.isJobRunning(sn_hamp.HAMConstants.NormalizationDailyJob)) {
		gs.info('HAM - Hardware Normalization job is already running');
		return;
	}
	new sn_hamp.HAMHardwareNormalization().process();
}
