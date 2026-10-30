(function executeRule(current, previous /*null when async*/ ) {
    var userDomain = gs.getUser().sys_domain;
    if (gs.nil(userDomain)) {
        userDomain = 'global';
    }
	current.setValue('sys_domain', userDomain);
})(current, previous);