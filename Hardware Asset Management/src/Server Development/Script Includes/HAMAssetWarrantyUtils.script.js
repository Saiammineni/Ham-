var HAMAssetWarrantyUtils = Class.create();
HAMAssetWarrantyUtils.prototype = {
    initialize: function() {
    },
	// returns all the hw assets with model's manufacturer contains lenovo
	getLenovoHwAssets: function() {
		var lenovoAssets = [];
		var counter = 0;
		var snsString = '';
		var tmpString = '';
		// Length of lenovo end point -  https://supportapi.lenovo.com/v2.5/warranty?
		var currentUrlLength = 44;
		var maxUrlLength = 2048;
		var assetGr = new GlideRecord('alm_hardware');
		assetGr.addQuery('model.manufacturer.name', 'CONTAINS', 'lenovo');
		assetGr.addQuery('install_status', 'NOT IN', [7,8]);
		assetGr.addNotNullQuery('serial_number');
		assetGr = HAMLicensingUtility.addHAMFlowsInclusionCriteria(assetGr);
		if(sn_hamp.HAMUtils.HAS_ONLY_TNI_ENTITLEMENT) {
			assetGr.addQuery('model_category.resource_category.opt_in', true);
		}
		assetGr.query();
		while (assetGr.next()) {
			if (counter == 0) {
					snsString = '';
					snsString = "Serial=" + assetGr.serial_number;
					counter++;
				} else {
					tmpString = snsString + "&Serial=" + assetGr.serial_number;
					if (currentUrlLength + tmpString.length > maxUrlLength) {
						lenovoAssets.push(snsString);
						counter = 0;
						snsString = '';
						snsString = "Serial=" + assetGr.serial_number;
					} else {
						snsString = tmpString;
					}
					counter++;
				}
		}
		if (counter != 0) {
			lenovoAssets.push(snsString);
		}
		return lenovoAssets;
	},
	// Process the warranty information received from Lenovo API for bulk SNs
	processLenovoWarrantyInfo: function(warrantyInfoJson) {
		var data = {};
		// loop through warranty info
		for(var assWarRec in warrantyInfoJson) {
			data.active = warrantyInfoJson[assWarRec].InWarranty;
			if (data.active) {
				data.status = 'Active';
			} else {
				data.status = 'Inactive';
			}
			data.country = warrantyInfoJson[assWarRec].Country;
			new global.GlideQuery('alm_asset')
				.where('serial_number', warrantyInfoJson[assWarRec].Serial)
				.selectOne('sys_id')
				.ifPresent(function(asset) {
					data.asset = asset.sys_id;
				});
			// Do not create / update warranty records if asset is not found
			if (gs.nil(data.asset)) {
				continue;
			}
			// loop through warranty sub records
			for(var warrantyRec in warrantyInfoJson[assWarRec].Warranty) {
				var warratyInfo = warrantyInfoJson[assWarRec].Warranty[warrantyRec];
				data.external_warranty_id = warratyInfo.ID;

				var warrantyGr = new GlideRecord('sn_itam_common_asset_warranty');
				warrantyGr.addQuery('asset', data.asset);
				warrantyGr.addQuery('external_warranty_id', data.external_warranty_id);
				warrantyGr.query();
				if(!warrantyGr.next()) {
					warrantyGr.initialize();
				}
				data.name = warratyInfo.Name;
				data.description = warratyInfo.Description;
				data.type = warratyInfo.Type;
				data.start_date = new GlideDateTime(warratyInfo.Start);
				data.end_date = new GlideDateTime(warratyInfo.End);
				
				// External warranty ID from Lenovo is not Unique
				// Based on SN and External warranty ID insert / update records
				this.insertOrUpdateWarrantyRecs(warrantyGr, data);
			}
		}
	},
	insertOrUpdateWarrantyRecs: function(warrantyGr, data) {
		for(var fields in data) {
			warrantyGr.setValue(fields, data[fields]);
		}
		warrantyGr.update();
	},
    type: 'HAMAssetWarrantyUtils'
};