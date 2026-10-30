var HAMSuccessPortalUtils = Class.create();
HAMSuccessPortalUtils.prototype = {
    initialize: function() {
    },

    type: 'HAMSuccessPortalUtils'
};

HAMSuccessPortalUtils.userBaseQualifier = 'active=true^web_service_access_only=false^ORweb_service_access_onlyISEMPTY';
HAMSuccessPortalUtils.successGoalOwnerReferenceQualifier = function(){
	return HAMSuccessPortalUtils.userBaseQualifier +'^sys_idIN' + new sn_itam_common.ITAMCommonUtil().getUsersByRole('asset');
};

HAMSuccessPortalUtils.successActivityAssignmentGroupQualifier = 'type=null^ORtype=1cb8ab9bff500200158bffffffffff62^active=true^EQ';
HAMSuccessPortalUtils.successGoalCategoryQualifier = 'ham_category=true';

HAMSuccessPortalUtils.showNewButtonForSuccessActivityRL = function(parent) {
	var goalStatusCheck = parent.getValue('status') !== 'cancelled' && parent.getValue('status') !== 'completed';
	var userRoleCheck = gs.hasRole('ham_admin') || (gs.hasRole('asset') && String(parent.owner) === gs.getUserID());
	return goalStatusCheck && userRoleCheck;
};

HAMSuccessPortalUtils.hamSuccessActivityWriteAccess = function(current) {
	var userID = gs.getUserID();
	var closedActivityState = [3,4,7];
	var activityNotClosed = closedActivityState.indexOf(current.state) === -1;
	var userRoleCheck = gs.hasRole('ham_admin')
		|| (gs.hasRole('asset') && (String(current.success_goal.owner) === userID || String(current.assigned_to) === userID))
		|| (gs.hasRole('itil') && String(current.assigned_to) === userID);
	return activityNotClosed && userRoleCheck;
};

