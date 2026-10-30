if (current.getValue('stage') === 'pending_certificate') {
	var assetAutomationAPI = new AssetAutomationAPI();
	assetAutomationAPI.completeAssetDisposalTask(current, 'dispose');
}
// redirect to the Disposal Documentation task
var uri = action.getGlideURI();
var sysID = uri.get('sysparm_collectionID');
var path = 'sn_hamp_hw_asset_disposal_task.do';
uri.set('sys_id', sysID);
action.setRedirectURL(uri.toString(path));
