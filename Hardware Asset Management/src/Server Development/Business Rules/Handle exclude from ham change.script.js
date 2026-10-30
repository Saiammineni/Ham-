(function executeRule(current, previous /*null when async*/) {
	if (sn_hamp.HAMLicensingUtility.isAssetIncludedInHAMFlows(current)){
		var assetHasExcludedRFIDResult = HAMLicensingUtility.assetHasExcludedRFIDTag(current);
		if (assetHasExcludedRFIDResult.assetHasExcludedRFIDTag) {
			sn_itam_common.ITAMCommonUtil.setStatusForRFIDAsset(
				assetHasExcludedRFIDResult.excludedRFIDAssetId,
				sn_itam_common.ITAMCommonUtil.RFID_STATUS.UNMATCHED
			);
		}
	} else {
		HAMLicensingUtility.preventAssetExclusionParentIfBundleOrPallet(current);
	}
	if (!current.isActionAborted()) {
		var message = sn_hamp.HAMLicensingUtility.getAssetWorkNotesMessage(current);
		current.work_notes = message;
	}
})(current, previous);