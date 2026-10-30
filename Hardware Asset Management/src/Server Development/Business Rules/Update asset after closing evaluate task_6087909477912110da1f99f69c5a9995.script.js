(function executeRule(current, previous /* null when async */) {
	var assetUpdateJSON = {
		install_status: 6,	// in stock
		stockroom: current.zero_touch_req.return_stockroom,
	};
	var evaluationStatus = current.getValue('evaluation_status');
	if (evaluationStatus === 'redeployable') {
		assetUpdateJSON.substatus = 'available';
	} else if (evaluationStatus === 'needs_repair') {
		assetUpdateJSON.substatus = 'pending_repair';
		// Request a RMA
		var gr = new GlideRecord("sn_hamp_rma_request");
		gr.initialize();
		gr.setNewGuidValue(gs.generateGUID());
		var userGr = new GlideRecord('sys_user');
		userGr.initialize();
		var assetJSON = [{
			asset: current.zero_touch_req.asset.toString(),
			quantity: 1,
		}];
		userGr.rma_assets = JSON.stringify(assetJSON);

		HAMRMAUtils.createRMALines(gr, userGr);
		gr.insert();
		current.work_notes = gs.getMessage('Return Merchandise Authorization order {0} is successfully submitted', gr.getDisplayValue());
		var zeroTouchReq = new GlideRecord('sn_hamp_ztr_request');
		zeroTouchReq.get(current.zero_touch_req);
		zeroTouchReq.rma_request = gr.getUniqueValue();
		zeroTouchReq.update();
	} else if (evaluationStatus === 'dispose') {
		assetUpdateJSON.substatus = 'pending_disposal';
	}
	new global.GlideQuery('alm_hardware')
		.where('sys_id', current.zero_touch_req.asset)
		.update(assetUpdateJSON);
}(current, previous));