var AssetAuditDateUtils = Class.create();
AssetAuditDateUtils.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {
	diffFromNow: function() {
        var inputDate = this.getParameter('sysparm_scheduled_date'); 
		var inputDateInternal =  global.AssetUtils.getInternalDate(inputDate,gs.getDateFormat()).getNumericValue();
		var currentDateInternal = new GlideDateTime().getLocalDate().getNumericValue();
		var diff =  inputDateInternal - currentDateInternal;
		return diff;
      },
	type: 'AssetAuditDateUtils',
});