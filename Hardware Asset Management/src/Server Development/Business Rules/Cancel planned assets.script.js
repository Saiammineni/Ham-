(function executeRule(current, previous /* null when async */) {
	var hampHWDisposalUtils = new HampHWDisposalUtils();
	hampHWDisposalUtils.cancelPlannedAssets(current);
}(current, previous));