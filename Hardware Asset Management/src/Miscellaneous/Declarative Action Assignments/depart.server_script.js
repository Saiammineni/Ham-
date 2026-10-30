if (current.getValue('stage') === 'draft' || current.getValue('stage') === 'verified') {
	var assetAutomationAPI = new sn_hamp.AssetAutomationAPI();
	assetAutomationAPI.completeAssetDisposalTask(current, 'depart');
}