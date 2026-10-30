(function overrideView(view, is_list) {
    if (!gs.hasRole('inventory_user')) {
        answer = 'loaner_request';
    }
})(view, is_list);