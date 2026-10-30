(function executeRule(current, previous) {
	var disposalGr = new GlideRecord('sn_hamp_hardware_disposal');
	if(disposalGr.get(current.hardware_disposal)){
		disposalGr.setValue('carrier', current.carrier);
		disposalGr.setValue('tracking_number', current.tracking_number);
		disposalGr.setValue('shipped_to', current.shipped_to);
		disposalGr.setWorkflow(false);
		disposalGr.update();
	}
}(current, previous));