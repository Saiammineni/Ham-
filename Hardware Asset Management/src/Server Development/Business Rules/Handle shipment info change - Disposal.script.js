(function executeRule(current, previous) {
	var previous_trackNum = !gs.nil(previous.tracking_number) ? previous.tracking_number : '';
	var domainId;
	if (global.ModelUtils.isDomainSeparationEnabled()) {
		domainId = current.getValue('sys_domain');
	}
	var shipment_id = DisposalOrderShipmentUtils.getShipmentOrderId(previous_trackNum, previous.vendor_order_id,
		HAMConstants.DISPOSAL_ORDER_TABLE, current.sys_id.toString(), domainId, previous.getValue('carrier'));
	if(!gs.nil(shipment_id)) {
		if(current.tracking_number.changes() || current.carrier.changes()) {
			DisposalOrderShipmentUtils.handleShipmentInfoChange(current, shipment_id);
		} else {
			var shipmentDetails = DisposalOrderShipmentUtils.setShipmentFieldsFromDisposalOrder(current);
			sn_itam_common.ShipmentUtils.updateFieldValuesOfShipmentOrder(shipment_id, shipmentDetails);
		}
	}
}(current, previous));