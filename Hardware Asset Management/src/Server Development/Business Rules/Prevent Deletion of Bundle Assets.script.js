(function executeRule(current, previous /* null when async */) {
	var asset = sn_hamp.HAMUtils.isAssetPresent(current.sys_id);
	if (asset) {
		gs.addErrorMessage(gs.getMessage('Release assets before deleting an Asset Bundle record.'));
		global.ModelUtils.setAbortAction(current, true);
	}
}(current, previous));