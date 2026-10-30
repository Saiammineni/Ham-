(function executeRule(current, previous /*null when async*/) {
	if(current.getValue('task_name') === sn_itam_common.ShipmentUtils.TASK_NAMES.SHIP) {
		sn_itam_common.AssetReclaimShipmentUtils.createShipmentForReclaim(current, 
		current.asset_reclaim_line.getRefRecord(),
		sn_itam_common.AssetReclaimShipmentUtils.HAM_RECLAIM_LINE_TABLE);
	} else if(current.getValue('task_name') === sn_itam_common.ShipmentUtils.TASK_NAMES.RECEIVE) {
		//Reclamation order is cancelled, which marks task 'Closed Incomplete'
		if(String(current.state) === '4') {
			sn_itam_common.ShipmentUtils.removeOrCancelAssetsFromShipment(current.asset_reclaim_line.asset.sys_id.toString(),
				String(current.asset_reclaim_line.sys_id),
				sn_itam_common.AssetReclaimShipmentUtils.HAM_RECLAIM_LINE_TABLE,
				'cancelled');
		}
		else {
			sn_itam_common.AssetReclaimShipmentUtils.receiveShipmentForReclaim(current,
			current.asset_reclaim_line.getRefRecord(),
			sn_itam_common.AssetReclaimShipmentUtils.HAM_RECLAIM_LINE_TABLE,
			sn_itam_common.AssetReclaimShipmentUtils.HAM_RECLAIM_TASK_TABLE);
		}
	}
})(current, previous);