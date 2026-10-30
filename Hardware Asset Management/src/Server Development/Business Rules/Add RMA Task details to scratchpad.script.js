(function executeRule(current, previous /* null when async */) {
	g_scratchpad.can_replace_asset = null;
	if (current.getValue('task_name') !== 'receive'
	|| current.getValue('vendor_action') !== 'replace'
	|| gs.nil(current.asset.parent)) {
		g_scratchpad.can_replace_asset = 'not_applicable';
	} else if (!gs.nil(current.replacement_asset)) {
		var replaceInfo = HAMRMAUtils.canReplaceAsset(current.getValue('asset'), current.getValue('replacement_asset'));
		g_scratchpad.can_replace_asset = replaceInfo.canReplace;
	}
}(current, previous));