(function executeRule(current, previous /* null when async */) {
	if ((current.operation() === 'insert' && current.getValue('po_type') !== 'purchase')
		|| (current.operation() === 'update' && !current.purchase_order_type.changes() && current.po_type.changes()
		&& current.getValue('purchase_order_type') === previous.getValue('po_type'))) {
		current.purchase_order_type = current.po_type;
	}
}(current, previous));