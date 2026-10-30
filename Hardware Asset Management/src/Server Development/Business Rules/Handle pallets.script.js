(function executeRule(current, previous /*null when async*/) {
	if (global.AssetUtils.IS_ITAM_COMMON_ACTIVE && sn_itam_common.ITAMCommonPalletsUtil && sn_itam_common.ITAMCommonPalletsUtil.isPallet((String)(current.hardware.sys_class_name))) {
		if (current.operation() == 'insert') {
			// Add all the contained assets into planned asset table
			sn_itam_common.ITAMCommonPalletsUtil.insertPalletAssetsIntoDisposal(current);
		} else if (current.operation() == 'delete' && current.getValue('stage') !== 'cancelled' && current.getValue('stage') !== 'auto_cancelled') {
			// Remove the contained assets of pallet
			sn_itam_common.ITAMCommonPalletsUtil.removePalletAssetsFromDisposal(current);
		}
	}
}(current, previous));