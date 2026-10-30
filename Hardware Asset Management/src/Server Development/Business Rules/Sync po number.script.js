(function executeRule(current, previous /* null when async */) {
	if ((current.operation() === 'insert' && !gs.nil(current.getValue('po_number'))
		&& gs.nil(current.getValue('purchase_order_number')))
		|| (current.operation() === 'update' && !current.purchase_order_number.changes() && current.po_number.changes()
		&& current.getValue('purchase_order_number') === previous.getValue('po_number'))) {
		current.purchase_order_number = current.po_number;
	}
}(current, previous));