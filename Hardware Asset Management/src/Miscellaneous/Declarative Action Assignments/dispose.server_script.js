if (current.getValue('stage') === 'pending_certificate') {
	var assetAutomationAPI = new sn_hamp.AssetAutomationAPI();
	assetAutomationAPI.completeAssetDisposalTask(current, 'dispose');
}