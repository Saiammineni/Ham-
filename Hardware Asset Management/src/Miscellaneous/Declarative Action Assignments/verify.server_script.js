if (current.getValue('stage') === 'draft') {
	var assetAutomationAPI = new sn_hamp.AssetAutomationAPI();
	assetAutomationAPI.completeAssetDisposalTask(current, 'verify');
}