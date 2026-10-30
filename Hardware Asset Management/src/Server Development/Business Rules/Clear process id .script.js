(function executeRule(current, previous /*null when async*/) {
	var assetGr = current.asset.getRefRecord();
	assetGr.setValue('process_id','');
	assetGr.setValue('process_table','');
	assetGr.update();

})(current, previous);