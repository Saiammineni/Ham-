var DisposalOrderShipmentUtils = Class.create();
DisposalOrderShipmentUtils.prototype = {
    initialize: function() {
    },

    type: 'DisposalOrderShipmentUtils'
};

DisposalOrderShipmentUtils.shipmentOrderCreation = function(disposalGr) {
	var tracking_number = !gs.nil(disposalGr.tracking_number) ? disposalGr.tracking_number : '';
	var vendor_id = disposalGr.hardware_disposal.vendor_order_id;
	var ship_date = disposalGr.hardware_disposal.scheduled_date;
	var shipped_by = !gs.nil(disposalGr.assigned_to) ? String(disposalGr.assigned_to.name) : '';
	var disposal_order = disposalGr.hardware_disposal.sys_id.toString();
	var ship_from = disposalGr.hardware_disposal.location.name;
	var ship_to = !gs.nil(disposalGr.shipped_to) ? disposalGr.shipped_to.name : '';
	var carrierDetails;
	if(!gs.nil(disposalGr.carrier)) {
		carrierDetails = {
			carrier : disposalGr.carrier.sys_id.toString()
		};
	}
	var stage = sn_itam_common.ShipmentUtils.SHIPMENT_STAGES.IN_TRANSIT;
	var domainId;
	if (global.ModelUtils.isDomainSeparationEnabled()) {
		domainId = String(disposalGr.hardware_disposal.sys_domain.sys_id);
	}

	var shipment_id = DisposalOrderShipmentUtils.getShipmentOrderId(tracking_number, vendor_id, HAMConstants.DISPOSAL_ORDER_TABLE, disposal_order, domainId, disposalGr.carrier.sys_id.toString());
	if(gs.nil(shipment_id)) {
		shipment_id = sn_itam_common.ShipmentUtils.createShipment(!gs.nil(tracking_number) ? tracking_number : vendor_id, 
		ship_date, shipped_by, ship_to, ship_from, carrierDetails, domainId);
	}
	new global.GlideQuery(HAMConstants.DISPOSAL_ASSET_M2M_TABLE)
	.where('hardware_disposal', disposal_order)
	.where('stage', stage)
	.select('hardware.sys_id', 'hardware.model', 'hardware.quantity')
	.forEach(function(hardwareData) {
		sn_itam_common.ShipmentUtils.addAssetToShipment(shipment_id, hardwareData.hardware.sys_id, hardwareData.hardware.model, hardwareData.hardware.quantity,
		disposal_order, HAMConstants.DISPOSAL_ORDER_TABLE, stage, domainId);

	});
};

DisposalOrderShipmentUtils.shipmentOrderClosure = function(disposalGr) {
	var received_date = new GlideDateTime();
	var disposal_order = disposalGr.hardware_disposal.sys_id.toString();
	var received_by = !gs.nil(disposalGr.assigned_to) ? String(disposalGr.assigned_to.name) : '';
	var shipDetails = {
		receive_date: received_date,
		received_by: received_by
	};

	new global.GlideQuery(HAMConstants.DISPOSAL_ASSET_M2M_TABLE)
		.where('hardware_disposal', disposal_order)
		.where('stage', 'pending_certificate')
		.select('hardware.sys_id', 'hardware.model.sys_id')
		.forEach(function(hardwareData) {
			sn_itam_common.ShipmentUtils.receiveShipment(disposal_order, HAMConstants.DISPOSAL_ORDER_TABLE, hardwareData.hardware.sys_id,
			hardwareData.hardware.model.sys_id, sn_itam_common.ShipmentUtils.SHIPMENT_ASSET_STAGES.DELIVERED, sn_itam_common.ShipmentUtils.SHIPMENT_STAGES.DELIVERED, shipDetails);
		});
};

DisposalOrderShipmentUtils.handleShipmentInfoChange = function(disposalOrderGr, prevShipmentId) {
	var newTrackingNum = !gs.nil(disposalOrderGr.tracking_number) ? disposalOrderGr.tracking_number : '';
	var domainId;
	if (global.ModelUtils.isDomainSeparationEnabled()) {
		domainId = disposalOrderGr.getValue('sys_domain');
	}
	var shipmentIdNew = DisposalOrderShipmentUtils.getShipmentOrderId(newTrackingNum, disposalOrderGr.vendor_order_id, HAMConstants.DISPOSAL_ORDER_TABLE,
		disposalOrderGr.sys_id.toString(), domainId,disposalOrderGr.carrier.sys_id.toString());
	if(gs.nil(shipmentIdNew)) {
		var additionalDetails = {
			shipped_to : !gs.nil(disposalOrderGr.shipped_to) ? disposalOrderGr.shipped_to.name : ''
		};
		shipmentIdNew = sn_itam_common.ShipmentUtils.createNewShipmentOrderFromOld(prevShipmentId, !gs.nil(disposalOrderGr.tracking_number) ? disposalOrderGr.tracking_number : disposalOrderGr.vendor_order_id, 
			disposalOrderGr.scheduled_date, disposalOrderGr.carrier, additionalDetails);
	}
	new global.GlideQuery(HAMConstants.DISPOSAL_ASSET_M2M_TABLE)
	.where('hardware_disposal', disposalOrderGr.sys_id.toString())
	.select('hardware.sys_id')
	.forEach(function(hardwareData) {
		sn_itam_common.ShipmentUtils.updateAsssetWithNewShipmentId(prevShipmentId, shipmentIdNew, hardwareData.hardware.sys_id);
	});
};

DisposalOrderShipmentUtils.setShipmentFieldsFromDisposalOrder = function(disposalOrderGr) {
	var shipmentDetails = {
		carrier : !gs.nil(disposalOrderGr.carrier) ? disposalOrderGr.carrier : '',
		shipped_to : !gs.nil(disposalOrderGr.shipped_to) ? disposalOrderGr.shipped_to.name : ''
	};
	return shipmentDetails;
};

DisposalOrderShipmentUtils.getShipmentOrderId = function(tracking_number, vendor_id, source_table, source_id, domainId, carrier) {
	var shipment_id;
	if(!gs.nil(tracking_number)) {
		shipment_id = sn_itam_common.ShipmentUtils.getShipmentOrderForTrackingNum(tracking_number, domainId, carrier);
	} else {
		shipment_id =sn_itam_common.ShipmentUtils.getShipmentOrderWithVendor(source_table, source_id, vendor_id, domainId, carrier);
	}
	return shipment_id;
};
