if (current.getValue('stage') !== 'cancelled') {
	current.stage = 'cancelled';
	current.update();
}
// redirect to the same page where planned asset got cancelled
var uri = action.getGlideURI();
var sysID = uri.get('sysparm_collectionID');
var path = 'sn_hamp_hw_asset_disposal_task.do';
if (parent) {
	path = parent.getTableName() + '.do';
}
uri.set('sys_id', sysID);
action.setRedirectURL(uri.toString(path));
