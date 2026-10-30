(function() {
	var ootbCatIds = [
		'2ffe9a8100a70010fa9b161c34f873cd',
		'0be11f58c7432010f74c784c95c260b7',
		'8c4cfdfb77b1a110da1f99f69c5a99d3'
	];
	var modelCatGr = new global.GlideQuery('cmdb_model_category')
		.where('ootb_category', '!=', 'y')
		.orWhereNull('ootb_category')
		.toGlideRecord();
	modelCatGr.addQuery('sys_id', 'IN', ootbCatIds);
	modelCatGr.setValue('ootb_category', 'y');
	modelCatGr.updateMultiple();
}());