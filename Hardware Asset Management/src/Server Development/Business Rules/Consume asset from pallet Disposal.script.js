(function executeRule(current, previous /*null when async*/) {

	if(global.AssetUtils.IS_ITAM_COMMON_ACTIVE && sn_itam_common.ITAMCommonPalletsUtil) {
		//whether new asset is part of a pallet
		var isParentPallet = global.AssetUtils.isParentPallet(current.hardware.parent);
		if(isParentPallet == true){
				var plannedAssetGr = new GlideRecord("sn_hamp_m2m_hw_asset_disposal");
				plannedAssetGr.addQuery('hardware_disposal',current.hardware_disposal);
				plannedAssetGr.addQuery('hardware',current.hardware.parent);	
				plannedAssetGr.query();
				if(!plannedAssetGr.next() || (plannedAssetGr.next() && (plannedAssetGr.stage == 'cancelled' || plannedAssetGr.stage == 'auto_cancelled'))){
					//call script include to remove child parent relationship
					sn_itam_common.ITAMCommonPalletsUtil.removeAssetFromPallet(current.hardware);
			}	
		}
	}	

})(current, previous);