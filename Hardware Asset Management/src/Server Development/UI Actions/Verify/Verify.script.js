if (current.getValue('stage') === 'draft') {
	var assetAutomationAPI = new AssetAutomationAPI();
	assetAutomationAPI.completeAssetDisposalTask(current, 'verify');
}
// redirect to the Verify assets task
var uri = action.getGlideURI();
var sysID = uri.get('sysparm_collectionID');
var path = 'sn_hamp_hw_asset_disposal_task.do';
uri.set('sys_id', sysID);
action.setRedirectURL(uri.toString(path));