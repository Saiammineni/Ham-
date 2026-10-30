(function process(g_request, g_response, g_processor) {
	
	var prop;
	var allSuccessfullyUpdated = true;

	var name = g_request.getParameter('sysparm_name');
	var util = new sn_hamp.HAMHardwareContentServiceOptUtil();

	
	if (name === 'saveSelection') {
		var updatedStatus = {};
		for (propIter in sn_hamp.HAMConstants.SHAREABLE_PROPERTIES) {
			prop = sn_hamp.HAMConstants.SHAREABLE_PROPERTIES[propIter];
			updatedStatus[prop] = g_request.getParameter('sysparm_' + prop);
			allSuccessfullyUpdated = util.modifyConfiguration(prop, updatedStatus[prop]) && allSuccessfullyUpdated;
		}
	}

	if (name == 'optOut') {
		for (propIter in sn_hamp.HAMConstants.SHAREABLE_PROPERTIES) {
			prop = sn_hamp.HAMConstants.SHAREABLE_PROPERTIES[propIter];
			allSuccessfullyUpdated = util.modifyConfiguration(prop, 'false') && allSuccessfullyUpdated;
		}
	}

	if (name == 'optIn') {
		for (propIter in sn_hamp.HAMConstants.SHAREABLE_PROPERTIES) {
			prop = sn_hamp.HAMConstants.SHAREABLE_PROPERTIES[propIter];
			allSuccessfullyUpdated = util.modifyConfiguration(prop, 'true') && allSuccessfullyUpdated;
		}
	}

	if (allSuccessfullyUpdated)
		g_processor.writeOutput("text/plain", true);
	else
		g_processor.writeOutput("text/plain", false);
})(g_request, g_response, g_processor);