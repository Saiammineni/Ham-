(function executeRule(current, previous /*null when async*/) {
	// Setting the domain of remote task to the domain of zero touch refresh fulfillment request
	current.sys_domain = current.parent.sys_domain;
})(current, previous);