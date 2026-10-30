var HAMPImportScriptUtil = Class.create();
HAMPImportScriptUtil.prototype = {
	STAGING_TABLE: 'sn_hamp_import_template',
	ATTACHMENT_TABLE: 'sys_attachment',
	FIELD_MAPPING: {},

	initialize: function() {},

	scheduleParseAttachment: function(fileName, tableSysId) {
		var script = 'new sn_hamp.HAMPImportScriptUtil().parseAttachmentFile("'
            + fileName + '", "' + tableSysId + '");';
		var job = new global.AssetManagementBaseJob();
		job.runScriptByJob(script, new GlideDateTime(), 'HAMP: Parse attachment for imported template',
			job.getCurrentDomainSysId(), null);
		var status = gs.getMessage('View import progress ');
		var hereMsg = gs.getMessage('here');
		var link = status + "<a href='/sys_import_set.do?sys_id="
            + tableSysId + "'>" + hereMsg + '.</a>';
		var returnObj = {};
		returnObj.result = 'success';
		returnObj.link = link;
		return global.JSON.stringify(returnObj);
	},

	/* populate list of template fields */
	_getFields: function() {
		var populateFields = new GlideRecord('sys_dictionary');
		populateFields.addQuery('name', this.STAGING_TABLE);
		populateFields.addEncodedQuery('internal_type!=collection^ORinternal_type=NULL');
		populateFields.query();
		var fieldMapping = {};
		while (populateFields.next()) {
			var name = populateFields.element.toString();
			var label = populateFields.column_label.toString().toLowerCase();
			fieldMapping[label] = name;
		}
		this.FIELD_MAPPING = fieldMapping;
	},

	cancelImportSet: function(importSetSysId) {
		var importSet = new GlideRecord('sys_import_set');
		if (importSet.get(importSetSysId)) {
			importSet.setValue('state', 'cancelled');
			importSet.setValue('short_description',
				gs.getMessage('There was no data found in the selected file. Ensure'
					+ ' the correct file was selected and the desired data is in the first sheet of the document.'));
			importSet.update();
		}
	},

	parseAttachmentFile: function(fileName, tableSysId) {
		/* find sys_id of attachment */
		var getAttachmentSysId = new GlideRecordSecure('sys_attachment');
		getAttachmentSysId.addQuery('file_name', fileName);
		getAttachmentSysId.addQuery('table_sys_id', tableSysId);
		getAttachmentSysId.setLimit(1);
		getAttachmentSysId.query();

		if (!getAttachmentSysId.hasNext()) {
			gs.error('HAMPImportScriptUtil: cannot find attachment in sys_attachment table');
			return;
		}

		/* instantiate GlideExcelParser and parse template */
		getAttachmentSysId.next();
		var attachmentSysId = getAttachmentSysId.sys_id;
		var parser = new sn_impex.GlideExcelParser();
		var attachment = new GlideSysAttachment();
		var attachmentStream = attachment.getContentStream(attachmentSysId);

		try {
			parser.parse(attachmentStream);
			var insertRow = new GlideRecordSecure(this.STAGING_TABLE);
			this._getFields();
			var headers = parser.getColumnHeaders();
			var rowCount = 0;

			while (parser.next()) {
				rowCount += 1;
				var row = parser.getRow();
				insertRow.initialize();

				/* construct row object */
				var rowData = {};
				for (var index = 0; index < headers.length; index++) {
					var col = (headers[index].toLowerCase()).trim();
					rowData[col] = row[headers[index]];
				}

				/* insert rows from template into a new record in staging table */
				var keys = Object.keys(rowData);
				for (var i = 0; i < keys.length; i++) {
					insertRow.setValue(this.FIELD_MAPPING[keys[i]], rowData[keys[i]]);
				}

				insertRow.setValue('sys_import_set', tableSysId);
				insertRow.insert();
			}

			if (rowCount === 0) {
				gs.error('HAMPImportScriptUtil: Empty template imported');
				this.cancelImportSet(tableSysId);
				return;
			}

			this.runTransformMaps(tableSysId);
			return;
		} catch (err) {
			gs.error('HAMPImportScriptUtil: error occurred while parsing attachment with exception:' + err);
		}
	},

	runTransformMaps: function(impSetSysId) {
		var importSet = new GlideRecord('sys_import_set');
		importSet.addQuery('sys_id', impSetSysId);
		importSet.query();
		if (importSet.next()) {
			var importSetRun = new GlideImportSetRun(impSetSysId);
			var importLog = new GlideImportLog(importSetRun, 'Create Assets from ASN template import');
			var ist = new GlideImportSetTransformer();
			ist.setLogger(importLog);
			ist.setImportSetRun(importSetRun);
			ist.setImportSetID(impSetSysId);
			ist.setSyncImport(true);
			ist.transformAllMaps(importSet);

			var getTransformHistory = new GlideRecord('sys_import_set_run');
			getTransformHistory.addQuery('set', impSetSysId);
			getTransformHistory.query();

			if (!getTransformHistory.hasNext()) {
				gs.error('HAMPImportScriptUtil: No Transform History record found');
			}
		} else {
			gs.error('HAMPImportScriptUtil: No import set found for transformation');
		}
	},

	getImportSetRecord: function(tableName) {
		var createImpSet = new GlideRecord('sys_import_set');
		createImpSet.initialize();
		createImpSet.mode = 'asynchronous';
		createImpSet.table_name = tableName;
		createImpSet.state = 'loading';
		var impSetSysId = createImpSet.insert();
		return impSetSysId;
	},

	type: 'HAMPImportScriptUtil',

};