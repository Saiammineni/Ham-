var HAMManufacturerUpdateHandler = Class.create();

HAMManufacturerUpdateHandler.prototype = {

	initialize: function() {
	},

	process: function(gr) {
		// Check if name has changed
		if (gs.nil(gr.getValue('stage_name'))) {
			throw new Error('Name of hardware manufacturer is blank');
		}

		if (gr.getValue('name') !== gr.getValue('stage_name')) {
			// Remove noChangeHandler and add specific handler, to handle changes if required.
			sn_hamp.HAMUpdateHandler.noChangeHandler(gr, 'name', 'stage_name', false);
		}

		// Check if webpage has changed
		if (gr.getValue('webpage') !== gr.getValue('stage_webpage')) {
			// Remove noChangeHandler and add specific handler, to handle changes if required.
			sn_hamp.HAMUpdateHandler.noChangeHandler(gr, 'webpage', 'stage_webpage', false);
		}

		// Check if webpage has changed
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

	type: 'HAMManufacturerUpdateHandler',
};

HAMManufacturerUpdateHandler._isUniqueManufacturerMapppedToCompany = function(params) {
	var count = new global.GlideQuery(sn_hamp.HAMConstants.CONTENT_TABLES.HW_MANUFACTURER)
		.where('company', params.oldCompany)
		.where('sys_id', '!=', params.hwManufacturerSysId)
		.select('sys_id')
		.limit(1)
		.toArray(1)
		.length;
	if (count === 0) {
		return true;
	}

	return false;
};

HAMManufacturerUpdateHandler.processCompanyChange = function(params) {
	var outputResult = {};
	if ((!gs.nil(params.hwManufacturerSysId)) && (params.newCompany !== params.oldCompany)) {
		var modelGr; var counter;
		var	stopWatch;
		var messageList = [];
		var isManufacturerUniqueForCompany = HAMManufacturerUpdateHandler._isUniqueManufacturerMapppedToCompany(params);
		sn_hamp.HAMConstants.MODEL_TYPES.forEach(function(table) {
			var message = {};
			// hwnorm2hamp stopWatch = new GlideStopWatch();
			stopWatch = global.ModelUtils.getStopWatch();
			modelGr = new GlideRecord(table);
			modelGr.addQuery('normalized_company', params.oldCompany);
			if (!isManufacturerUniqueForCompany) {
				modelGr.addQuery('normalized_product.hw_manufacturer', params.hwManufacturerSysId);
			}
			modelGr.query();
			counter = 0;
			while (modelGr.next()) {
				// hwnorm2hamp modelGr.setWorkflow(false);
				// Update normalized_company on hardware/consumable model
				modelGr.setValue('normalized_company', params.newCompany);
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
	} else {
		outputResult.status = global.ContentUpdateAPI.STATUS_FAILURE;
	}
	return outputResult;
};