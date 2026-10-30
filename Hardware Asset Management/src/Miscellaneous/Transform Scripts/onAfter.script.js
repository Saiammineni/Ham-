(function runTransformScript(source, map, log, target /*undefined onStart*/ ) {
      /* Handles the shipment for the assets imported through ASN */
	if (source.getValue('sys_import_state') !== "ignored") {
		sn_itam_common.PurchaseOrderShipmentUtils.createShipmentAssetsASNPO(String(target.sys_id));
	}
})(source, map, log, target);