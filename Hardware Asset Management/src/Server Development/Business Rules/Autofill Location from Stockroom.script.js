(function executeRule(current, previous /* null when async */) {
	// Add your code here
	if (current.getValue('type') === 'stockroom') {
		var stockroomGQ = new global.GlideQuery('alm_stockroom')
			.get(current.stockroom, ['location'])
			.get();
		current.location = stockroomGQ.location;
	}
}(current, previous));