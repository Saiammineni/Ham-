(function executeRule(current, previous /*null when async*/) {
	if(String(current.task_name) === sn_itam_common.RMAShipmentUtils.SHIPMENT_TASK) {
		//Create shipment to vendor
		sn_itam_common.RMAShipmentUtils.createShipmentForRMA(current, current.rma_request_line.getRefRecord(), 
		sn_hamp.HAMRMAUtils.RMA_REQUEST_LINE_TABLE);
	}
	else if(String(current.task_name) === sn_itam_common.RMAShipmentUtils.VENDOR_RMA_DECISION_TASK) {
		//Close shipment to vendor
		sn_itam_common.RMAShipmentUtils.closeShipmentForRMA(current, current.rma_request_line.getRefRecord(), 
		sn_hamp.HAMRMAUtils.RMA_REQUEST_LINE_TABLE);
		
		//Create shipment from vendor
		sn_itam_common.RMAShipmentUtils.createShipmentForRMA(current, current.rma_request_line.getRefRecord(), 
		sn_hamp.HAMRMAUtils.RMA_REQUEST_LINE_TABLE);
	}
	else if(String(current.task_name) === sn_itam_common.RMAShipmentUtils.RECEIVE) {
		//Close shipment from vendor
		sn_itam_common.RMAShipmentUtils.closeShipmentForRMA(current, current.rma_request_line.getRefRecord(), 
		sn_hamp.HAMRMAUtils.RMA_REQUEST_LINE_TABLE);
	}

})(current, previous);