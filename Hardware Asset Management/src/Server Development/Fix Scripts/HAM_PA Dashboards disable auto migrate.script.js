var pa_dashboard_sys_ids = ['39f6b4a453d01010249addeeff7b1287' /* Hardware Normalization Dashboard */, '68deca7e531200106b86ddeeff7b12b9' /* Hardware Asset */]; 
var paDashboardsRecord = new GlideRecord('pa_dashboards');
paDashboardsRecord.addQuery('sys_id', 'IN', pa_dashboard_sys_ids);
paDashboardsRecord.query();
while(paDashboardsRecord.next()){
	paDashboardsRecord.no_bulk_migration = true;
	paDashboardsRecord.update();
}
