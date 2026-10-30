(function executeRule(current, previous /* null when async */) {
	if (gs.nil(current.assigned_to)) {
		current.assigned_to = gs.getUserID();
	}
}(current, previous));