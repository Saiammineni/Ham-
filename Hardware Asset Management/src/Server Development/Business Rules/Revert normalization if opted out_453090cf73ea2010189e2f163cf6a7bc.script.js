(function executeRule(current, previous) {
	var normalizeApi = new sn_hamp.HAMHardwareNormalizationEngine();
	normalizeApi.setFieldsToRevertNormStatus(current);
}(current, previous));