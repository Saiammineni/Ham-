if (current.getValue('stage') === 'draft' || current.getValue('stage') === 'verified') {
	var assetAutomationAPI = new AssetAutomationAPI();
	assetAutomationAPI.completeAssetDisposalTask(current, 'depart');
}
// redirect to the Asset Departure task
var uri = action.getGlideURI();
var sysID = uri.get('sysparm_collectionID');
var path = 'sn_hamp_hw_asset_disposal_task.do';
uri.set('sys_id', sysID);
action.setRedirectURL(uri.toString(path));
