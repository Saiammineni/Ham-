var uri = action.getGlideURI();

var taskSysID = uri.get('sysparm_collectionID');
var hardwareDisposalSysID;
if (taskSysID) {
	var taskRecord = new global.GlideQuery('sn_hamp_hw_asset_disposal_task')
		.get(taskSysID, ['hardware_disposal']);
	hardwareDisposalSysID = taskRecord._value.hardware_disposal;
}
uri.set('sysparm_m2m_ref', 'sn_hamp_m2m_hw_asset_disposal');
uri.set('sysparm_stack', 'no');
uri.set('sysparm_collection', 'sn_hamp_hardware_disposal');
uri.set('sysparm_collectionID', hardwareDisposalSysID);
uri.set('sysparm_collection_key', 'hardware_disposal');
uri.set('sysparm_collection_label', gs.getMessage('Planned Assets'));
uri.set('sysparm_collection_related_field', 'hardware');
uri.set('sysparm_collection_related_file', 'alm_asset');
uri.set('sysparm_form_type', 'm2m');
var query = 'install_status=6^substatus=pending_disposal^stockroom=';
var hardwareDisposalRecord;
if (hardwareDisposalSysID) {
	hardwareDisposalRecord = new global.GlideQuery('sn_hamp_hardware_disposal')
		.get(hardwareDisposalSysID, ['stockroom']);
	query += hardwareDisposalRecord._value.stockroom;
}
uri.set('sysparm_query', query);
action.setRedirectURL(uri.toString('sys_m2m_template.do'));