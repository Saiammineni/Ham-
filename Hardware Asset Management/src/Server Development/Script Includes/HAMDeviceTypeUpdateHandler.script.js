var HAMDeviceTypeUpdateHandler = Class.create();

HAMDeviceTypeUpdateHandler.prototype = {
	initialize: function() {
	},

	process: function(gr) {
		// Check if name has changed
		if (gs.nil(gr.getValue('stage_name'))) {
			throw new Error('Name of device type is blank');
		}

		if (gr.getValue('name') !== gr.getValue('stage_name')) {
			// Remove noChangeHandler and add specific handler, to handle changes if required.
			sn_hamp.HAMUpdateHandler.noChangeHandler(gr, 'name', 'stage_name', false);
		}

		if (gr.getValue('unspsc_commodity_id') !== gr.getValue('stage_unspsc_commodity_id')) {
			// Remove noChangeHandler and add specific handler, to handle changes if required.
			sn_hamp.HAMUpdateHandler.noChangeHandler(gr, 'unspsc_commodity_id', 'stage_unspsc_commodity_id', false);
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

	type: 'HAMDeviceTypeUpdateHandler',
};