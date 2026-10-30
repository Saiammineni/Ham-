(function executeRule(current, previous /*null when async*/) {

	// Add your code here
	// Triggering email notifications for all users with asset role, when shipment task is complete for refresh method ship
	var assetUsers = [];
	var userRole = new GlideRecord('sys_user_has_role');
	userRole.addQuery('role.name', 'asset');
	userRole.query();
	while(userRole.next()){
		assetUsers.push(userRole.getValue('user'));
	}

	gs.eventQueue("sn_hamp.zero_touch_refresh.shipment_ship", current, assetUsers, assetUsers);

})(current, previous);