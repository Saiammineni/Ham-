function onLoad() {
	function hideShipment(po) {
		if (po.po_type === 'lease_buyout' || po.po_type === 'lease_extension'
			|| po.po_type === 'lease_settlement') {
			g_form.setSectionDisplay('shipment', false);
		}
	}
	g_form.getReference('purchase_order', hideShipment);
}