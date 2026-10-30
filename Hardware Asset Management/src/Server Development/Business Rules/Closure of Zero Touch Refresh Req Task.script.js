(function executeRule(current, previous /*null when async*/) {
	var zeroTouchRefReqTask = new GlideRecord("sn_hamp_ztr_task");
	var state = current.getValue('order_state').toString();
	zeroTouchRefReqTask.addQuery('zero_touch_req', current.sys_id);
	zeroTouchRefReqTask.addQuery('state','IN', '1,2'); //1 is 'Open' & 2 is 'Work in progress'
	if (state === '2'){
		// If state of the order is marked as confirmed fetch request confirmation task
		zeroTouchRefReqTask.addQuery('task_name', 'request_confirmation');
	}
	else{
		// If state of the order is marked as shipped fetch request shipment task
		zeroTouchRefReqTask.addQuery('task_name', 'request_shipment');
	}
	zeroTouchRefReqTask.query();
	if (zeroTouchRefReqTask.next()) {
		if (state === '3') {
			// Check if asset with same serial number exists
			var assetGr = new GlideRecord("alm_hardware");
			assetGr.addQuery('serial_number', current.fulfillment_request.serial_number);
			assetGr.query();
			if(assetGr.hasNext()){
				while(assetGr.next()){
					if(assetGr.getValue('install_status') == 6 && assetGr.getValue('substatus') == 'available' && assetGr.getValue('model') == current.replacement_model){
						// Check if existing asset is in state 'In Stock', substate 'Available' and of the required model
						assetGr.setValue('asset_tag', current.fulfillment_request.asset_tag);
						assetGr.setValue('install_status', 9);
						assetGr.setValue('substatus', 'reserved');
						assetGr.setValue('reserved_for', current.requested_for);
						assetGr.update();
						// Updation of refreshed asset field with the existing asset
						current.refreshed_asset = assetGr.getUniqueValue();
					}
				}
			}
			else {
				// Creation of new hardware asset
				var asset = new GlideRecord("alm_hardware");
				asset.initialize();
				asset.setValue('model', current.replacement_model);
				// Asset model category is the first model category of the model
				var modelCategories = current.replacement_model.cmdb_model_category;
				var modelCategoriesArr = modelCategories.split(',');
				asset.model_category = modelCategoriesArr[0];
				asset.setValue('asset_tag', current.fulfillment_request.asset_tag);
				asset.setValue('serial_number', current.fulfillment_request.serial_number);
				asset.setValue('install_status', 9);
				asset.setValue('substatus', 'reserved');
				asset.setValue('reserved_for', current.requested_for);
				asset.insert();
				// Updation of refreshed asset with the asset created
				current.refreshed_asset = asset.getUniqueValue();
			}
		}
		// Close the respective task
		zeroTouchRefReqTask.state = '3';
		zeroTouchRefReqTask.update();
	}

})(current, previous);