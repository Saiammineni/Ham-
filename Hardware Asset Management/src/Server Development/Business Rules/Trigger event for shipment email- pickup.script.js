(function executeRule(current, previous /*null when async*/) {

	// Add your code here
	// Triggering email notifications for all users with asset role and the stockroom manager of the stockroom, when shipment task is complete for refresh method ship
	var users = [];
	var userRole = new GlideRecord('sys_user_has_role');
	userRole.addQuery('role.name', 'asset');
	userRole.query();
	while(userRole.next()){
		users.push(userRole.getValue('user'));
	}

	var locationGr = new GlideRecord('cmn_location');
	locationGr.addQuery('street', current.zero_touch_req.street);
	locationGr.addQuery('city', current.zero_touch_req.city);
	locationGr.addQuery('state', current.zero_touch_req.state_loc);
	locationGr.addQuery('country', current.zero_touch_req.country);
	locationGr.addQuery('zip', current.zero_touch_req.zip);
	locationGr.query();
	
	if(locationGr.next()) {
		var stockroomGr = new GlideRecord('alm_stockroom');
		stockroomGr.addQuery('location', locationGr.sys_id);
		stockroomGr.query();
		if(stockroomGr.next()) {
			users.push(stockroomGr.manager);
		}
	}

	gs.eventQueue("sn_hamp.zero_touch_refresh.shipment_pick", current, users, users);

})(current, previous);