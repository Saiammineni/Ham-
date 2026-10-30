(function executeRule(current, previous /*null when async*/) {
	if (!gs.nil(current.hardware) && sn_hamp.HAMUtils.isParentAsset(current.hardware.sys_id)) {
		var message = gs.getEscapedMessage('Changes to parent asset {0} would also be applied to child assets', current.hardware.getDisplayValue());
		gs.addInfoMessage(message);
	}
}(current, previous));