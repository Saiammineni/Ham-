(function executeRule(current, previous /*null when async*/) {

	if (global.AssetUtils.IS_ITAM_COMMON_ACTIVE && sn_itam_common.ITAMCommonPalletsUtil && !gs.nil(current.asset.parent)) {
		
		//whether new asset is part of a pallet
		var isParentPallet = global.AssetUtils.isParentPallet(current.asset.parent);
		if(isParentPallet == true){
			//call script include to remove child parent relationship
			sn_itam_common.ITAMCommonPalletsUtil.removeAssetFromPallet(current.asset);
		}	
	}

})(current, previous);