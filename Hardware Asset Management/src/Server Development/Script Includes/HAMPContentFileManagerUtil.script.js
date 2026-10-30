var HAMPContentFileManagerUtil = Class.create();
HAMPContentFileManagerUtil.prototype = {
	MANAGE_HW_LIBRARY_TABLE: 'sn_hamp_manage_hw_library',
	SYS_ATTACHMENT_TABLE: 'sys_attachment',
	SCHEDULED_JOB_SCRIPT_TABLE: 'sysauto_script',
	CDS_CLIENT_STAGING_TABLE: 'cds_client_staging',
	CONTENT_MANAGER_SCHEDULED_JOB: 'f9f6b4a453d01010249addeeff7b12a9',
	ATTACHMENT_TYPE: 'application/zip',
	STATUS_IN_PROGRESS: 'in_progress',
	CONTENT_UPDATE_JOB: 'bdf6b4a453d01010249addeeff7b12a9',
	CONTENT_TABLES_TO_EXPORT: [],
	initialize: function() {
		this.contentAPI = new sn_hamp.HAMContentAPI();
		this.contentUtilAPI = new global.HAMContentUtil();
	},
	_isJobActive: function(currOperation) {
		var gqActive = new global.GlideQuery(this.MANAGE_HW_LIBRARY_TABLE)
			.where('status', this.STATUS_IN_PROGRESS)
			.limit(1)
			.select('content_type')
			.toArray(1);
		if (gqActive.length > 0) {
			var message;
			var msgParms = [];
			msgParms.push(gqActive[0].content_type);
			msgParms.push(currOperation);
			message = gs.getMessage(
				'{0} is in progress. Please run {1} after {0} is complete', msgParms
			);
			gs.addErrorMessage(message);
			return true;
		}
		return false;
	},
	_updateStatus: function(grCur, status) {
		grCur.setValue('status', status);
		grCur.update();
	},
	_triggerScheduledJob: function() {
		var jobGr = new global.GlideQuery(this.SCHEDULED_JOB_SCRIPT_TABLE)
			.where('sys_id', this.CONTENT_MANAGER_SCHEDULED_JOB)
			.where('active', true)
			.limit(1)
			.toGlideRecord();
		jobGr.query();
		if (jobGr.next()) {
			gs.executeNow(jobGr);
		}
	},
	_verifyImportAttachment: function(grCur) {
		var gqAttach = new global.GlideQuery(this.SYS_ATTACHMENT_TABLE)
			.where('table_name', grCur.getTableName())
			.where('table_sys_id', grCur.getUniqueValue())
			.select('content_type')
			.limit(2)
			.toArray(2);
		if (gqAttach.length > 1) {
			// eslint-disable-next-line max-len
			gs.addErrorMessage(gs.getMessage('Multiple file content import is not supported currently. Please remove invalid files before running import.'));
		} else if (gqAttach.length === 1) {
			if (gqAttach[0].content_type === this.ATTACHMENT_TYPE) {
				return true;
			}
			gs.addErrorMessage(gs.getMessage('Please attach a valid content file.'));
		} else {
			gs.addErrorMessage(gs.getMessage('Please attach a file before running import.'));
		}
		return false;
	},
	invokeContentManagerAPI: function() {
		var grType = new global.GlideQuery(this.MANAGE_HW_LIBRARY_TABLE)
			.where('status', this.STATUS_IN_PROGRESS)
			.limit(1)
			.toGlideRecord();
		grType.query();
		if (grType.next()) {
			var contentType = grType.getValue('content_type');
			try {
				if (contentType === 'import') {
					// Cannot invoke scriptable from scoped app, hence using HAMContentAPI
					this.contentUtilAPI.invokeContentManagerAPI(this.MANAGE_HW_LIBRARY_TABLE,
						grType.getUniqueValue(), null, null);
					// Cannot delete attachments from scope, hence using HAMContentAPI
					this.contentUtilAPI.deleteAttachments(this.MANAGE_HW_LIBRARY_TABLE, grType.getUniqueValue());
					// For new records, copy values from staged to actual columns
					this.setDefaultValues();
					this._updateStatus(grType, 'successfully_imported');
					/*
					1. XML import computes WHO columns for new records if unspecified in XML
					2. WHO columns are not part of exported content XML. Hence they are not
					automatically refreshed for existing records
					3. Weekly content update job processes records that are updated after it's last run date.
					In this case, it won't pick up updated records as sys_updated_on is not modified
					4. Hence clearing off last run date to enable processing of all content records
					5. As on-prem customers do not get data on a weekly basis, this would not
					cause huge performance overhead
					*/
					this.updateLastRunDate();
					// Trigger content update job
					this.triggerContentUpdateJob();
				} else {
					var data = this.contentAPI.CONFIG;
					for (var key in data) {
						this.CONTENT_TABLES_TO_EXPORT.push(data[key].clientTable);
					}
					// Cannot invoke scriptable from scoped app, hence using HAMContentAPI
					this.contentUtilAPI.invokeContentManagerAPI(this.MANAGE_HW_LIBRARY_TABLE, grType.getUniqueValue(),
						this.CONTENT_TABLES_TO_EXPORT.join(), 'HAM_Normalization_Content');
					this._updateStatus(grType, 'ready_for_download');
				}
			} catch (err) {
				// cannot gs.addErrorMessage because this function is invoked by a job, so log it
				gs.error(err, this.type);
				this._updateStatus(grType, 'failed');
			}
		}
	},
	contentImport: function(grCur) {
		// Run import only if valid attachment exists and if job is not active
		if (this._verifyImportAttachment(grCur) && !this._isJobActive(grCur.getValue('content_type'))) {
			this._updateStatus(grCur, this.STATUS_IN_PROGRESS);
			this._triggerScheduledJob();
		}
	},
	contentExport: function(grCur) {
		// Verify if there are any records to export
		var grStaging = new global.GlideQuery(this.CDS_CLIENT_STAGING_TABLE)
			.toGlideRecord();
		grStaging.query();
		if (!grStaging.hasNext()) {
			gs.addErrorMessage(gs.getMessage('No data available to Export. Please contact support.'));
		} else if (!this._isJobActive(grCur.getValue('content_type'))) {
			// Run export only if job is not active
			this._updateStatus(grCur, this.STATUS_IN_PROGRESS);
			// Cannot delete attachments from scope, hence using HAMContentAPI
			this.contentUtilAPI.deleteAttachments(this.MANAGE_HW_LIBRARY_TABLE, grCur.getUniqueValue());
			this._triggerScheduledJob();
		}
	},
	setDefaultValues: function() {
		var gr;
		var props;
		var mandatoryColumns;
		var stageColumn;
		var tablesMap = sn_hamp.HAMUpdateHandler.TABLES_MAP;
		for (var table in tablesMap) {
			props = tablesMap[table];
			mandatoryColumns = props.mandatoryColumns;
			gr = new global.GlideQuery(table).toGlideRecord();
			if (gr.isValid()) {
				for (var index in mandatoryColumns) {
					var mcolumn = mandatoryColumns[index];
					if (gr.isValidField(mcolumn)) {
						gr.addNullQuery(mcolumn);
					}
				}
				gr.query();
				while (gr.next()) {
					var mapping = props.mapping;
					var column;
					for (column in mapping) {
						stageColumn = mapping[column];
						if (gr.isValidField(column) && gr.isValidField(stageColumn)) {
							gr.setValue(column, gr.getValue(stageColumn));
						}
					}
					gr.setWorkflow(false);
					gr.update();
				}
			}
		}
	},
	triggerContentUpdateJob: function() {
		var job = new global.GlideQuery('sysauto_script')
			.where('sys_id', this.CONTENT_UPDATE_JOB)
			.limit(1)
			.toGlideRecord();
		job.query();
		if (job.next()) {
			gs.executeNow(job);
		}
	},
	updateLastRunDate: function() {
		// Glidequery is not setting value to blank
		// Hence using toGlideRecord
		var gr = new global.GlideQuery(sn_hamp.HAMUpdateHandler.JOB_PARAMS.propertyTableName)
			.where('key', sn_hamp.HAMUpdateHandler.JOB_PARAMS.keyLastRunDate)
			.toGlideRecord();
		gr.query();
		if (gr.next()) {
			gr.setValue('value', '');
			gr.update();
		}
	},
	type: 'HAMPContentFileManagerUtil',
};