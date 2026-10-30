(function executeRule(current, previous /* null when async */) {
	var plannedAssetStage;
	if (current.operation() === 'delete') {
		plannedAssetStage = current.getValue('stage');
	} else {
		plannedAssetStage = previous.getValue('stage');
	}
	var hampHWDisposalUtils = new HampHWDisposalUtils();
	hampHWDisposalUtils.revert(current, plannedAssetStage);
}(current, previous));