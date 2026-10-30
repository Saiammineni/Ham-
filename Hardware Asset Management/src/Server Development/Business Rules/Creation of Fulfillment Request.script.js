(function executeRule(current, previous /*null when async*/) {
	// Creation of zero touch refresh fulfillment request
	var refreshOrder = new GlideRecord("sn_itam_ztr_fulfillment_req");
	refreshOrder.initialize();
	refreshOrder.customer_request_number = current.number;
	refreshOrder.model = current.replacement_model.display_name;
	// Setting shipment details
	refreshOrder.name = current.name;
	refreshOrder.email = current.email;
	refreshOrder.mobile = current.mobile;
	refreshOrder.street = current.street;
	refreshOrder.city = current.city;
	refreshOrder.state_loc = current.state_loc;
	refreshOrder.country = current.country;
	refreshOrder.zip = current.zip;
	refreshOrder.provider = current.provider.name;
	// Setting return details
	if (current.return_stockroom.manager) {
		refreshOrder.return_name = current.return_stockroom.manager.name;
	}
	refreshOrder.return_street = current.return_stockroom.location.street;
	refreshOrder.return_city = current.return_stockroom.location.city;
	refreshOrder.return_state_loc = current.return_stockroom.location.state;
	refreshOrder.return_country = current.return_stockroom.location.country;
	refreshOrder.return_zip = current.return_stockroom.location.zip;
	if (global.ModelUtils.isDomainSeparationEnabled()) {
		refreshOrder.sys_domain = current.sys_domain;
	}
	var refreshOrderId = refreshOrder.insert();
	// Setting the reference to fulfillment request
	current.fulfillment_request = refreshOrderId;
})(current, previous);