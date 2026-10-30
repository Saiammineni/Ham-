function _ifSimilarRecordExist(device) {
	var sysDomainId = gs.nil(device.sys_domain) ? 'global' : device.sys_domain;

	var deviceGR = new GlideRecord(sn_hamp.HAMConstants.CONTENT_TABLES.DEVICE_TYPE);
	deviceGR.addQuery('name', device.name);
	deviceGR.addQuery('sys_domain', sysDomainId);

	deviceGR.setLimit(1);
	deviceGR.query();

	return deviceGR.hasNext();
}

function _processInsert(currentDevice) {
	if (_ifSimilarRecordExist(currentDevice)) {
		gs.addErrorMessage(gs.getMessage('There is already a device with the same name'));
		currentDevice.setAbortAction(true);
	}
}

function _processUpdate(currentDevice) {
	if (currentDevice.name.changes()) {
		if (_ifSimilarRecordExist(currentDevice)) {
			gs.addErrorMessage(gs.getMessage('There is already a device with the same name'));
			currentDevice.setAbortAction(true);
		}
	}
}

(function executeRule(current) {
	if (current.operation() === 'insert') {
		_processInsert(current);
	} else if (current.operation() === 'update') {
		_processUpdate(current);
	}
}(current));