(function executeRule(current, previous /* null when async */) {
	if (current.getValue('stage') === 'cancelled') {
		sn_hamp.HAMRMAUtils.processRMALineCancellation(previous);
	}
	sn_hamp.HAMRMAUtils.updateRMARequestState(current);
}(current, previous));