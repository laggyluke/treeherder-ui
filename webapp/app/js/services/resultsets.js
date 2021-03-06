'use strict';

treeherder.factory('thResultSets', [
    '$http', '$location', 'thUrl', 'thServiceDomain', 'ThLog',
    function($http, $location, thUrl, thServiceDomain, ThLog) {

    var $log = new ThLog("thResultSets");

    // get the resultsets for this repo
    return {
        getResultSets: function(repoName, rsOffsetId, count, resultsetlist, with_jobs, full, keep_filters) {
            rsOffsetId = typeof rsOffsetId === 'undefined'?  0: rsOffsetId;
            count = typeof count === 'undefined'?  10: count;
            with_jobs = _.isUndefined(with_jobs) ? true: with_jobs;
            full = _.isUndefined(full) ? true: full;
            keep_filters = _.isUndefined(keep_filters) ? true : false;

            var params = {
                full: full,
                format: "json",
                with_jobs: with_jobs
            };

            if (count > 0) {
                params.count = count;
            }

            if(rsOffsetId > 0){
                params.id__lt = rsOffsetId;
            }

            if(keep_filters){
                // if there are any search params on the url line, they should
                // pass directly to the set of resultsets.
                // with the exception of ``repo``.  That has no effect on the
                // service at this time, but it could be confusing.
                var locationParams = _.clone($location.search());
                delete locationParams.repo;

                // support date ranges.  we must convert the strings to a timezone
                // appropriate timestamp
                $log.debug("locationParams", locationParams);
                if (_.has(locationParams, "startdate")) {
                    params.push_timestamp__gte = Date.parse(
                        locationParams.startdate)/1000;

                    delete locationParams.startdate;
                }
                if (_.has(locationParams, "enddate")) {
                    params.push_timestamp__lt = Date.parse(
                        locationParams.enddate)/1000 + 84600;

                    delete locationParams.enddate;
                }

                $log.debug("updated params", params);
                _.extend(params, locationParams);
            }

            if (resultsetlist) {
                _.extend(params, {
                    offset: 0,
                    count: resultsetlist.length,
                    id__in: resultsetlist.join()
                });
            }
            return $http.get(thUrl.getProjectUrl("/resultset/", repoName),
                             {params: params}
            );
        },
        get: function(uri) {
            return $http.get(thServiceDomain + uri, {params: {format: "json"}});
        }
    };
}]);
