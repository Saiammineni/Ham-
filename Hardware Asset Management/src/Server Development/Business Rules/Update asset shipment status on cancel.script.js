(function executeRule(current, previous) {
	sn_itam_common.ShipmentUtils.removeOrCancelAssetsFromShipment(current.hardware.sys_id.toString(), current.hardware_disposal.sys_id.toString(), 
	HAMConstants.DISPOSAL_ORDER_TABLE, 'cancelled');
}(current, previous));