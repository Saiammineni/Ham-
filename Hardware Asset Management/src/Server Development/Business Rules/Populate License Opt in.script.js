(function executeRule(current, previous) {
	var normalizeApi = new sn_hamp.HAMHardwareNormalizationEngine();
	normalizeApi.populateLicenseOptIn(current);
}(current, previous));