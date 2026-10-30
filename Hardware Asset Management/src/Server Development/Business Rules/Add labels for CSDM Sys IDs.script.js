(function executeRule(current, previous /* null when async */) {
	var lcStage = new GlideRecord('life_cycle_stage');
	lcStage.get(current.life_cycle_stage);
	current.life_cycle_stage = lcStage.getValue('name');

	var lcStageStatus = new GlideRecord('life_cycle_stage_status');
	lcStageStatus.get(current.life_cycle_stage_status);
	current.life_cycle_stage_status = lcStageStatus.getValue('name');
}(current, previous));