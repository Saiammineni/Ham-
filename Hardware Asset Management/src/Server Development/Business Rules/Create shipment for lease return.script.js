(function executeRule(current, previous /*null when async*/) {
	if(current.getValue('task_name') === new sn_hamp.HAMLeaseContractExpirationUtils().SHIPMENT_TASK) {
		sn_itam_common.LeaseReturnShipmentUtils.createShipmentForLeaseReturn(current, "sn_hamp_contract_asset_task");
	}
	else if(current.getValue('task_name') === new sn_hamp.HAMLeaseContractExpirationUtils().RETURN_CONFIRMATION_TASK) {
		sn_itam_common.LeaseReturnShipmentUtils.closeShipmentForLeaseReturn(current, "sn_hamp_contract_asset_task",
		new sn_hamp.HAMLeaseContractExpirationUtils().SHIPMENT_TASK);
	}

})(current, previous);