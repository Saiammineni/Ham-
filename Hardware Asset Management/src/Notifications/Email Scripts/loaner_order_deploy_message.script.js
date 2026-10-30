(function runMailScript(/* GlideRecord */ current, /* TemplatePrinter */ template,
          /* Optional EmailOutbound */ email, /* Optional GlideRecord */ email_action,
          /* Optional GlideRecord */ event) {
	var msg;
	var loanerOrder = "<a href='/sn_hamp_loaner_asset_order.do?sys_id=" + current.loaner_order.sys_id + "&sysparm_view=loaner_request'>" + current.loaner_order.number + "</a>";
msg = "Please note that the loaner asset for "+loanerOrder+" is ready to be deployed.";
template.print(msg +"<br/>");
})(current, template, email, email_action, event);