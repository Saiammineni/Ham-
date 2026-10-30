(function executeRule(current, previous /* null when async */) {
	if (current.is_waitlisted) {
		// eslint-disable-next-line max-len
		current.work_notes = gs.getMessage('Loaner Asset Order is waitlisted due to insufficient stock for requested start date and end date');
	} else {
		current.work_notes = gs.getMessage('Loaner Asset Order is confirmed');
	}
}(current, previous));