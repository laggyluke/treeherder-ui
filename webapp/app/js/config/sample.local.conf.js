'use strict';

// mozilla hosted service
//window.thServiceDomain = "http://dev.treeherder.mozilla.org";

// local vagrant instance of service
window.thServiceDomain = "http://local.treeherder.mozilla.org";

//treeherder.config(['$logProvider', 'ThLogConfigProvider',
//    function($logProvider, ThLogConfigProvider) {
//
//    // enable or disable debug messages using $log.
//    // comment out the next line to enable them
//    $logProvider.debugEnabled(true);
//
//    // add classes to the blacklist.  all debug messages except
//    // these will print
//    ThLogConfigProvider.setBlacklist([
//        'thRepoDropDown',
//        'RepositoryPanelCtrl',
//        'thWatchedRepo'
//        ...
//    ]);
//
//    // add classes to the whitelist.  Only debug messages with
//    // these classes will print
//    ThLogConfigProvider.setWhitelist([
//        'thRepoDropDown',
//        'RepositoryPanelCtrl',
//        'thWatchedRepo',
//        ...
//    ]);
//}]);
