var HAMPImportTemplateAjaxUtil = Class.create();
HAMPImportTemplateAjaxUtil.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {

	createImpSetRecord: function() {
		var tableName = this.getParameter('sysparm_tablename');
    if (sn_hamp.HAMUtils.getTableExtensions('sn_hamp_import_template').indexOf(tableName) === -1) {
      return '';
    }
		var importTemplateUtil = new HAMPImportScriptUtil();
		var impSetSysId = importTemplateUtil.getImportSetRecord(tableName);
		return impSetSysId;
	},

	parseAttachmentClient: function() {
		var fileName = this.getParameter('sysparm_filename');
		var recordSysId = this.getParameter('sysparm_table_sys_id');
		return new HAMPImportScriptUtil().scheduleParseAttachment(fileName, recordSysId);
	},

	type: 'HAMPImportTemplateAjaxUtil',
});