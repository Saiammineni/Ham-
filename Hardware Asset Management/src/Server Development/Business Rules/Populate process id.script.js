(function executeRule(current, previous /*null when async*/) {
	var assetGr = current.asset.getRefRecord();
	assetGr.setValue('process_id',current.getUniqueValue());
	assetGr.setValue('process_table',current.getTableName());
	assetGr.update();

})(current, previous);