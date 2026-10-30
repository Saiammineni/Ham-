var HAMHardwareContentServiceOptUtil = Class.create();
HAMHardwareContentServiceOptUtil.prototype = {
	initialize: function () { },

	getConfiguration: function () {
		var status = {
			optInStatus: false,
		};

		new global.GlideQuery('sn_hamp_configuration')
			.where('name', 'IN', sn_hamp.HAMConstants.SHAREABLE_PROPERTIES)
			.select('name', 'value')
			.forEach(function(config) {
				if (config.value === 'true') {
					status[config.name] = true;
					status.optInStatus = true;
				} else if (config.value === 'false') {
					status[config.name] = false;
				}
			});

		return JSON.stringify(status);
	},

	modifyConfiguration: function (propName, propValue) {
		// Checks if user has sufficient access/roles to modify configuration.
		if (global.ModelUtils.hasHAMAdminRole()) {
			new global.GlideQuery('sn_hamp_configuration')
				.where('name', propName)
				.updateMultiple({ value: '' + propValue });
			return true;
		}
		return false;
	},

	type: 'HAMHardwareContentServiceOptUtil',
};