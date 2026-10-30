(function executeRule(current, previous) {
	var taskName = current.getValue('task_name');
	if (taskName === 'depart' || taskName === 'verify') {
		var assetDisposalUtils = new AssetDisposalUtils();
		assetDisposalUtils.populateAssetCount(current, taskName);
	}
}(current, previous));