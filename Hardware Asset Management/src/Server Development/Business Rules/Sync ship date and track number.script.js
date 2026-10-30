(function executeRule(current, previous /* null when async */) {
	if ((current.operation() === 'insert' && !gs.nil(current.getValue('track_number'))
		&& gs.nil(current.getValue('tracking_number')))
		|| (current.operation() === 'update' && !current.tracking_number.changes() && current.track_number.changes()
		&& current.getValue('tracking_number') === previous.getValue('track_number'))) {
		current.tracking_number = current.track_number;
	}

	if ((current.operation() === 'insert' && !gs.nil(current.getValue('ship_date'))
		&& gs.nil(current.getValue('shipping_date')))
		|| (current.operation() === 'update' && !current.shipping_date.changes() && current.ship_date.changes()
		&& current.getValue('shipping_date') === previous.getValue('ship_date'))) {
		current.shipping_date = current.ship_date;
	}
}(current, previous));