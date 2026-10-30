(function executeRule(current, previous /*null when async*/) {
	// Mac addr is prioritised over Mac address
	if (current.mac_addr.changes()) {
		current.mac_address = current.mac_addr;
	} else if (current.mac_address.changes()) {
		current.mac_addr = current.mac_address;
	}
})(current, previous);