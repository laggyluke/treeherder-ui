'use strict';

treeherder.directive('thFilterCheckbox', [
    'thResultStatusInfo',
    function (thResultStatusInfo) {

    return {
        restrict: "E",
        link: function(scope, element, attrs) {
            scope.checkClass = thResultStatusInfo(scope.filterName).btnClass + "-count-classified";
        },
        templateUrl: 'partials/thFilterCheckbox.html'
    };
}]);

treeherder.directive('thWatchedRepo', [
    'ThLog',
    function (ThLog) {

    var $log = new ThLog("thWatchedRepo");

    var statusInfo = {
        "open": {
            icon: "fa-circle-o",
            color: "treeOpen"
        },
        "approval required": {
            icon: "fa-lock",
            color: "treeApproval"
        },
        "closed": {
            icon: "fa-times-circle",
            color: "treeClosed"
        },
        "unavailable": {
            icon: "fa-chain-broken",
            color: "treeUnavailable"
        }
    };

    return {
        restrict: "E",
        link: function(scope, element, attrs) {

            scope.updateCount = function() {
                scope.adjustedUnclassifiedFailureCount = scope.getUnclassifiedFailureCount(
                    scope.name);
            };

            scope.updateTitleText = function() {
                if (scope.repoData.treeStatus) {
                    scope.titleText = scope.repoData.treeStatus.status;

                    if (scope.adjustedUnclassifiedFailureCount > 0) {
                        scope.titleText = scope.titleText + ' - ' +
                            scope.adjustedUnclassifiedFailureCount +
                            " unclassified failures in past week";
                    }
                    if (scope.repoData.treeStatus.message_of_the_day) {
                        scope.titleText = scope.titleText + ' - ' +
                            scope.repoData.treeStatus.message_of_the_day;
                    }
                }
            };

            scope.$watch('repoData', function(newVal) {
                if (newVal.treeStatus) {
                    $log.debug("updated treeStatus", newVal.treeStatus.status);
                    scope.statusIcon = statusInfo[newVal.treeStatus.status].icon;
                    scope.statusColor = statusInfo[newVal.treeStatus.status].color;
                    scope.updateCount();
                    scope.updateTitleText();
                }
            }, true);

            scope.$watch('isSkippingExclusionProfiles()', function(newVal) {
                scope.updateCount();
                scope.updateTitleText();
            });

        },
        templateUrl: 'partials/thWatchedRepo.html'
    };
}]);

treeherder.directive('thRepoDropDown', [
    'ThLog', 'ThRepositoryModel',
    function (ThLog, ThRepositoryModel) {

    var $log = new ThLog("thRepoDropDown");

    return {
        restrict: "E",
        replace: true,
        link: function(scope, element, attrs) {

            scope.name = attrs.name;
            var repo_obj = ThRepositoryModel.getRepo(attrs.name);
            scope.pushlog = repo_obj.url +"/pushloghtml";

            scope.$watch('repoData.treeStatus', function(newVal) {
                if (newVal) {
                    $log.debug("updated treeStatus", repo_obj, newVal);
                    scope.reason = newVal.reason;
                    scope.message_of_the_day = newVal.message_of_the_day;
                }
            }, true);

        },
        templateUrl: 'partials/thRepoDropDown.html'
    };
}]);
