(function executeRule(current, previous) {
	if(String(current.task_name) === sn_itam_common.ShipmentUtils.TASK_NAMES.DEPART) {
		sn_hamp.DisposalOrderShipmentUtils.shipmentOrderCreation(current);
	}

	if(String(current.task_name) === sn_itam_common.ShipmentUtils.TASK_NAMES.CONFIRM) {
		sn_hamp.DisposalOrderShipmentUtils.shipmentOrderClosure(current);
	}

}(current, previous));