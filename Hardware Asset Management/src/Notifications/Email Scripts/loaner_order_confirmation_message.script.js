(function runMailScript(/* GlideRecord */ current, /* TemplatePrinter */ template,
          /* Optional EmailOutbound */ email, /* Optional GlideRecord */ email_action,
          /* Optional GlideRecord */ event) {
	var isWaitlisted = String(current.is_waitlisted);
	var model = String(current.model.display_name);
	var msg;
	var loanerOrder = "<a href='/sn_hamp_loaner_asset_order.do?sys_id=" + current.sys_id + "&sysparm_view=loaner_request'>" + current.getDisplayValue() + "</a>";
	if(isWaitlisted === 'true'){
		msg = "Your request "+ loanerOrder +" for loaner asset "+ model +" is added into a waitlist.";
		template.print(msg +"<br/>");
	}else{
		msg = "Your request "+ loanerOrder +" for loaner asset "+ model +" is accepted.";
		template.print(msg +"<br/>");
	}

})(current, template, email, email_action, event);