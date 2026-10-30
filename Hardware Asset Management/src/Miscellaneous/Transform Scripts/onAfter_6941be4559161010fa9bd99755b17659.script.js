(function runTransformScript(source, map, log, target /*undefined onStart*/ ) {
    if (source.getValue('sys_import_state') !== "ignored") {
		var carrier;
		var shipCarrier = new GlideRecord('sn_itam_common_shipping_carrier');
		shipCarrier.addQuery('name',source.carrier);
		shipCarrier.addQuery('status','active');
		shipCarrier.query();
		if(shipCarrier.next()) {
			carrier = shipCarrier.getUniqueValue();
		}

        var getPol = new GlideRecord('proc_po_item');
        if (!gs.nil(target.purchase_line)) {
            getPol.get(target.purchase_line);
            // As part of Defect DEF0205479, correcting the PO status to pending from Pending Delivery
			getPol.status = "pending";
			// Populate shipping carrier if referece is found else populate old carrier field
			if(!gs.nil(carrier)) {
				getPol.setValue('shipping_carrier', carrier);
				getPol.setValue('carrier', 'NULL');
			} else {
				getPol.carrier = source.carrier;
				getPol.setValue('shipping_carrier', 'NULL');
			}
			getPol.ship_date = source.ship_date;
            getPol.shipping_date = source.ship_date;
			getPol.track_number = source.track_number;
            getPol.tracking_number = source.track_number;
            getPol.update();
        }
    }
})(source, map, log, target);