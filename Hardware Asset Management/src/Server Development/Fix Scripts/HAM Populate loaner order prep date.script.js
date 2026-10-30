var script = 'new sn_hamp.HAMFixScripts().runLoanerOrderPrepStartDateFixScript();';
var job = new global.AssetManagementBaseJob();
job.runScriptByJob(script, new GlideDateTime(), 'HAM Populate loaner order prep date');