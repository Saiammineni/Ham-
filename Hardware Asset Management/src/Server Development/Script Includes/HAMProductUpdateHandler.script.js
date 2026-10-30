var HAMProductUpdateHandler = Class.create();

HAMProductUpdateHandler.prototype = {
	initialize: function() {
	},

	process: function(gr) {
		// check if mandatory fields are empty
		if (gs.nil(gr.getValue('stage_name'))) {
			throw new Error('Name of hardware product is blank');
		}

		if (gs.nil(gr.getValue('stage_device_type'))) {
			throw new Error('Device type of hardware product is blank');
		}

		if (gs.nil(gr.getValue('stage_hw_manufacturer'))) {
			throw new Error('Manufacturer of hardware product is blank');
		}

		// Check if name has changed
		if (gr.getValue('name') !== gr.getValue('stage_name')) {
			// Remove noChangeHandler and add specific handler, to handle changes if required.
			sn_hamp.HAMUpdateHandler.noChangeHandler(gr, 'name', 'stage_name', false);
		}

		// Check if device has changed
		if (gr.getValue('device_type') !== gr.getValue('stage_device_type')) {
			sn_hamp.HAMProductUpdateHandler.deviceChangeHandler(gr, 'device_type', 'stage_device_type');
		}

		// Check if manufacturer has changed
		if (gr.getValue('hw_manufacturer') !== gr.getValue('stage_hw_manufacturer')) {
			sn_hamp.HAMProductUpdateHandler.manufacturerChangeHandler(gr, 'hw_manufacturer', 'stage_hw_manufacturer');
		}

		// Check if description has changed
		if (gr.getValue('description') !== gr.getValue('stage_description')) {
			// Remove noChangeHandler and add specific handler, to handle changes if required.
			sn_hamp.HAMUpdateHandler.noChangeHandler(gr, 'description', 'stage_description', false);
		}

		// Check if active has changed
		if (gr.getValue('active') !== gr.getValue('stage_active')) {
			// Remove noChangeHandler and add specific handler, to handle changes if required.
			sn_hamp.HAMUpdateHandler.noChangeHandler(gr, 'active', 'stage_active', false);
		}
	},

	type: 'HAMProductUpdateHandler',
};

HAMProductUpdateHandler.deviceChangeHandler = function(gr, column, stagingColumn) {
	var comments = '';
	var params = {
		hwProductSysId: gr.getUniqueValue(),
		oldDeviceType: gr.getValue(column),
		newDeviceType: gr.getValue(stagingColumn),
	};

	var result = HAMProductUpdateHandler.processDeviceChange(params);
	if (result.status === 'SUCCESS') {
		comments = result.message.map(function(msg) {
			return msg.table + ' : ' + msg.recordCount + ' : ' + msg.time;
		}).join('\n');
	}

	// Auditing and Update
	global.ContentAuditUtil.addAuditEntry(gr.getTableName(), gr.getValue('sys_id'), column,
		gr.getDisplayValue(column), gr.getDisplayValue(stagingColumn), comments,
		sn_hamp.HAMUpdateHandler.AUDIT_TABLE, gr.getValue(column), gr.getValue(stagingColumn));
	sn_hamp.HAMUpdateHandler.updateRecord(gr, column, stagingColumn);
};

HAMProductUpdateHandler.manufacturerChangeHandler = function(gr, column, stagingColumn) {
	var comments = '';
	var params = {
		hwProductSysId: gr.getUniqueValue(),
		oldManufacturer: gr.getValue(column),
		newManufacturer: gr.getValue(stagingColumn),
	};

	// update model record
	var result = HAMProductUpdateHandler.processManufacturerChange(params);
	if (result.status === 'SUCCESS') {
		comments = result.message.map(function(msg) {
			return msg.table + ' : ' + msg.recordCount + ' : ' + msg.time;
		}).join('\n');
	}

	// Auditing and Update
	global.ContentAuditUtil.addAuditEntry(gr.getTableName(), gr.getValue('sys_id'), column,
		gr.getDisplayValue(column), gr.getDisplayValue(stagingColumn), comments,
		sn_hamp.HAMUpdateHandler.AUDIT_TABLE, gr.getValue(column), gr.getValue(stagingColumn));
	sn_hamp.HAMUpdateHandler.updateRecord(gr, column, stagingColumn);
};

HAMProductUpdateHandler.processDeviceChange = function (params) {
	var outputResult = {};
	if ((!gs.nil(params.hwProductSysId)) && (params.newDeviceType !== params.oldDeviceType)) {
		var stopWatch;
		var messageList = [];

		sn_hamp.HAMConstants.MODEL_TYPES.forEach(function(table) {
			var message = {};
			// hwnorm2hamp stopWatch = new GlideStopWatch();
			stopWatch = global.ModelUtils.getStopWatch();

			var gr = new GlideRecord(table);
			gr.addQuery('normalized_product', params.hwProductSysId);
			gr.addQuery('normalized_device_type', params.oldDeviceType);
			gr.setValue('normalized_device_type', params.newDeviceType);
			// hwnorm2hamp gr.setWorkflow(false);
			// hwnorm2hamp gr.updateMultiple();
			global.ModelUtils.updateMultipleDisableBR(gr);

			message.table = table;
			message.recordCount = gr.getRowCount();
			// hwnorm2hamp message.time = stopWatch.toString();
			message.time = global.ModelUtils.getStopWatchTime(stopWatch);
			messageList.push(message);
		});
		outputResult.message = messageList;
		outputResult.status = global.ContentUpdateAPI.STATUS_SUCCESS;
	} else {
		outputResult.status = global.ContentUpdateAPI.STATUS_FAILURE;
	}
	return outputResult;
};

HAMProductUpdateHandler.processManufacturerChange = function (params) {
	var outputResult = {};
	if ((!gs.nil(params.hwProductSysId)) && (params.newManufacturer !== params.oldManufacturer)) {
		var manufacturerGr = new global.GlideQuery(sn_hamp.HAMConstants.CONTENT_TABLES.HW_MANUFACTURER);
		var oldCompany = manufacturerGr.where('sys_id', params.oldManufacturer)
			.select('company')
			.limit(1)
			.toArray(1)[0]
			.company;
		if (oldCompany) {
			var modelGr; var counter;
			var stopWatch;
			var newCompany;
			var messageList = [];

			sn_hamp.HAMConstants.MODEL_TYPES.forEach(function(table) {
				var message = {};
				// hwnorm2hamp stopWatch = new GlideStopWatch();
				stopWatch = global.ModelUtils.getStopWatch();
				modelGr = new GlideRecord(table);
				modelGr.addQuery('normalized_product', params.hwProductSysId);
				modelGr.addQuery('normalized_company', oldCompany);
				modelGr.query();
				counter = 0;
				while (modelGr.next()) {
					if (counter === 0) {
						newCompany = manufacturerGr.where('sys_id', params.newManufacturer)
							.select('company')
							.limit(1)
							.toArray(1)[0]
							.company;
						if (!newCompany) {
							newCompany = new sn_hamp.HAMCoreCompanyUtil()
								.resolveForCoreCompanyByManufacturer(params.newManufacturer);
						}
					}
					// hwnorm2hamp modelGr.setWorkflow(false);
					// Update normalized_company on hardware/consumable model
					modelGr.setValue('normalized_company', newCompany);
					// Update display name
					sn_hamp.HAMUtils.calculateModelDisplayName(modelGr);
					// hwnorm2hamp modelGr.update();
					global.ModelUtils.updateDisableBR(modelGr);
					counter += 1;
				}
				message.table = table;
				message.recordCount = counter;
				// hwnorm2hamp message.time = stopWatch.toString();
				message.time = global.ModelUtils.getStopWatchTime(stopWatch);
				messageList.push(message);
			});
			outputResult.message = messageList;
			outputResult.status = global.ContentUpdateAPI.STATUS_SUCCESS;
		}
	} else {
		outputResult.status = global.ContentUpdateAPI.STATUS_FAILURE;
	}
	return outputResult;
};