(function executeRule(current, previous) {
	var assetDisposalUtils = new AssetDisposalUtils();
	assetDisposalUtils.updateAssetCount(current, 'verified');
	if (String(current.hardware_disposal.stage) === 'in_transit') {
		assetDisposalUtils.updateAssetCount(current, 'departed');
	}
}(current, previous));