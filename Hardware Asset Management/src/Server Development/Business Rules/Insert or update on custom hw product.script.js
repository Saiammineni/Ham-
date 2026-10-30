function _ifSimilarRecordExist(product) {
	var sysDomainId = gs.nil(product.sys_domain) ? 'global' : product.sys_domain;

	var productGR = new GlideRecord(sn_hamp.HAMConstants.CONTENT_TABLES.HW_PRODUCT);

	var qc = productGR.addQuery('hw_manufacturer.company',product.company);
	qc.addOrCondition('hw_manufacturer.company.name', product.company.name);
	productGR.addQuery('name', product.name);
	productGR.addQuery('sys_domain', sysDomainId);

	productGR.setLimit(1);
	productGR.query();

	return productGR.hasNext();
}

function _processInsert(currentProduct) {
	if (_ifSimilarRecordExist(currentProduct)) {
		gs.addErrorMessage(gs.getMessage('There is already a product with the same name and hardware manufacturer'));
		currentProduct.setAbortAction(true);
	} else {
		var manufacturerID = new sn_hamp.HAMCoreCompanyUtil().resolveForManufacturerByCoreCompany(currentProduct);
		if (manufacturerID) {
			currentProduct.hw_manufacturer = manufacturerID;
		} else {
			currentProduct.setAbortAction(true);
		}
	}
}

function _processUpdate(currentProduct, previousProduct) {
	// Uniqueness check on product updation.
	if (currentProduct.name.changes() || currentProduct.company.changes() || currentProduct.hw_manufacturer.changes()) {
		if (currentProduct.hw_manufacturer.changes()) {
			if (gs.nil(currentProduct.hw_manufacturer.company)) {
				var companyID = new sn_hamp.HAMCoreCompanyUtil().resolveForCoreCompanyByManufacturer(currentProduct.hw_manufacturer);
				if (companyID) {
					currentProduct.company = companyID;
				} else {
					currentProduct.setAbortAction(true);
				}
			} else {
				currentProduct.company = currentProduct.hw_manufacturer.company;
			}
		}
		if (_ifSimilarRecordExist(currentProduct)) {
			gs.addErrorMessage(gs.getMessage('There is already a product with the same name and hardware manufacturer'));
			currentProduct.setAbortAction(true);
		} else if (currentProduct.company.changes()) {
			var manufacturerID = new sn_hamp.HAMCoreCompanyUtil().resolveForManufacturerByCoreCompany(currentProduct);
			if (manufacturerID) {
				currentProduct.hw_manufacturer = manufacturerID;
			} else {
				currentProduct.setAbortAction(true);
			}
		}
	}

	var params;
	// Process device type change
	if (currentProduct.device_type.changes() && (!gs.nil(currentProduct.device_type)) && (!gs.nil(previousProduct.device_type))) {
		params = {};
		params.hwProductSysId = currentProduct.getValue('sys_id');
		params.newDeviceType = currentProduct.getValue('device_type');
		params.oldDeviceType = previousProduct.getValue('device_type');
		// hwnorm2hamp global.HAMProductUpdateHandler.processDeviceChange(params);
		sn_hamp.HAMProductUpdateHandler.processDeviceChange(params);
	}
	// Process manufacturer change
	if (currentProduct.hw_manufacturer.changes() && (!gs.nil(currentProduct.hw_manufacturer)) && (!gs.nil(previousProduct.hw_manufacturer))) {
		params = {};
		params.hwProductSysId = currentProduct.getValue('sys_id');
		params.newManufacturer = currentProduct.getValue('hw_manufacturer');
		params.oldManufacturer = previousProduct.getValue('hw_manufacturer');
		// hwnorm2hamp global.HAMProductUpdateHandler.processManufacturerChange(params);
		sn_hamp.HAMProductUpdateHandler.processManufacturerChange(params);
	}
}

(function executeRule(current, previous) {
	if (current.operation() === 'insert') {
		_processInsert(current);
	} else if (current.operation() === 'update') {
		_processUpdate(current, previous);
	}
}(current, previous));