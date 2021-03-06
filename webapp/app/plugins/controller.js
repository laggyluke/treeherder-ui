"use strict";

treeherder.controller('PluginCtrl', [
    '$scope', '$rootScope', 'thUrl', 'ThJobClassificationModel',
    'thClassificationTypes', 'ThJobModel', 'thEvents', 'dateFilter',
    'numberFilter', 'ThBugJobMapModel', 'thResultStatus', 'thSocket',
    'ThResultSetModel', 'ThLog', '$q', 'thPinboard', 'ThJobArtifactModel',
    function PluginCtrl(
        $scope, $rootScope, thUrl, ThJobClassificationModel,
        thClassificationTypes, ThJobModel, thEvents, dateFilter,
        numberFilter, ThBugJobMapModel, thResultStatus, thSocket,
        ThResultSetModel, ThLog, $q, thPinboard, ThJobArtifactModel) {

        var $log = new ThLog("PluginCtrl");

        $scope.job = {};

        var timeout_promise = null;

        var selectJob = function(newValue, oldValue) {
            // preferred way to get access to the selected job
            if (newValue) {
                $scope.job_detail_loading = true;
                $scope.job = newValue;

                if(timeout_promise !== null){
                    $log.debug("timing out previous job request");
                    timeout_promise.resolve();
                }
                timeout_promise = $q.defer();

                // get the details of the current job
                ThJobModel.get($scope.repoName, $scope.job.id, {
                    timeout: timeout_promise
                }).then(function(data){
                    $scope.job = data;
                    $rootScope.$broadcast(thEvents.jobDetailLoaded);
                    updateVisibleFields();
                    $scope.job_detail_loading = false;
                    $scope.logs = data.logs;
                });

                ThJobArtifactModel.get_list({
                    name: "buildapi",
                    "type": "json",
                    job_id: $scope.job.id
                }, {timeout: timeout_promise})
                .then(function(data) {
                    if (data.length === 1 && _.has(data[0], 'blob')){
                        $scope.job.build_id = data[0].blob.id;
                    }
                });

                $scope.visibleFields = {
                    "Job Name": $scope.job.job_type_name,
                    "Start time": "",
                    "Duration":  "",
                    "Machine ": "",
                    "Build": ""
                };
                $scope.lvUrl = thUrl.getLogViewerUrl($scope.job.id);
                $scope.resultStatusShading = "result-status-shading-" + thResultStatus($scope.job);

                $scope.updateClassifications();
                $scope.updateBugs();
            }
        };

        var updateVisibleFields = function() {
                var undef = "";
                // fields that will show in the job detail panel
                var duration = ($scope.job.end_timestamp-$scope.job.start_timestamp)/60;
                if (duration) {
                    duration = numberFilter(duration, 0) + " minutes";
                }

                $scope.visibleFields = {
                    "Job Name": $scope.job.job_type_name || undef,
                    "Start time": dateFilter($scope.job.start_timestamp*1000, 'short') || undef,
                    "Duration":  duration || undef,
                    "Machine ": $scope.job.machine_platform_architecture + " " +
                                $scope.job.machine_platform_os || undef,
                    "Build": $scope.job.build_architecture + " " +
                             $scope.job.build_platform  + " " +
                             $scope.job.build_os || undef
                };
        };

        $scope.getCountPinnedJobs = function() {
            return thPinboard.count.numPinnedJobs;
        };

        $scope.togglePinboardVisibility = function() {
            $scope.isPinboardVisible = !$scope.isPinboardVisible;
        };

        $scope.$watch('getCountPinnedJobs()', function(newVal, oldVal) {
            if (oldVal === 0 && newVal > 0) {
                $scope.isPinboardVisible = true;
            }
        });

        /**
         * Test whether or not the selected job is a reftest
         */
        $scope.isReftest = function() {
            if ($scope.selectedJob) {
                return $scope.selectedJob.job_group_symbol === "R";
            } else {
                return false;
            }
        };

        $rootScope.$on(thEvents.jobClick, function(event, job) {
            selectJob(job, $rootScope.selectedJob);
            $rootScope.selectedJob = job;
        });

        $rootScope.$on(thEvents.jobsClassified, function(event, job) {
            $scope.updateClassifications();
        });

        $rootScope.$on(thEvents.bugsAssociated, function(event, job) {
            $scope.updateBugs();
        });

        $scope.bug_job_map_list = [];

        $scope.classificationTypes = thClassificationTypes.classifications;

        // load the list of existing classifications (including possibly a new one just
        // added).
        $scope.updateClassifications = function() {
            ThJobClassificationModel.get_list({job_id: $scope.job.id}).then(function(response) {
                $scope.classifications = response;
            });
        };
        // when classifications comes in, then set the latest note for the job
        $scope.$watch('classifications', function(newValue, oldValue) {
            if (newValue && newValue.length > 0) {
                $scope.job.note=newValue[0];
            }
        });

        // load the list of bug associations (including possibly new ones just
        // added).
        $scope.updateBugs = function() {
            ThBugJobMapModel.get_list({job_id: $scope.job.id}).then(function(response) {
                $scope.bugs = response;
            });
        };

        $scope.pinboard_service = thPinboard;

        var updateClassification = function(classification){
            if(classification.who !== $scope.user.email){
                // get a fresh version of the job
                ThJobModel.get_list($scope.repoName, {id:classification.id})
                .then(function(job_list){
                    if(job_list.length > 0){
                        var job = job_list[0];
                        // get the list of jobs we know about
                        var jobMap  = ThResultSetModel.getJobMap(classification.branch);
                        var map_key = "key"+job.id;
                        if(jobMap.hasOwnProperty(map_key)){
                            // update the old job with the new info
                            _.extend(jobMap[map_key].job_obj,job);
                            var params = { jobs: {}};
                            params.jobs[job.id] = jobMap[map_key].job_obj;
                            // broadcast the job classification event
                            $rootScope.$broadcast(thEvents.jobsClassified, params);
                        }
                    }

                });

            }

        };

        thSocket.on("job_classification", updateClassification);

        $scope.tabs = {
            "bug_suggestions": {
                title: "Bug suggestions",
                content: "plugins/bug_suggestions/main.html",
                active: true
            },
            "annotations": {
                title: "Annotations",
                content: "plugins/annotations/main.html"
            },
            "similar_jobs": {
                title: "Similar jobs",
                content: "plugins/similar_jobs/main.html"
            }
        };

        $scope.show_tab = function(tab){
            if(tab.active !== true){
                angular.forEach($scope.tabs, function(v,k){
                    v.active=false;
                });
                tab.active = true;
            }
        };

    }
]);

treeherder.controller('TinderboxPluginCtrl', [
    '$scope', '$rootScope', 'ThLog', 'ThJobArtifactModel', '$q',
    function TinderboxPluginCtrl(
        $scope, $rootScope, ThLog, ThJobArtifactModel, $q) {

        var $log = new ThLog(this.constructor.name);

        $log.debug("Tinderbox plugin initialized");
        var timeout_promise = null;


        var update_job_info = function(newValue, oldValue){
            $scope.tinderbox_lines = [];
            $scope.tinderbox_lines_parsed = [];

            if(newValue){
                $scope.is_loading = true;

                if(timeout_promise !== null){
                            timeout_promise.resolve();
                }
                timeout_promise = $q.defer();

                ThJobArtifactModel.get_list({
                    name: "Job Info",
                    "type": "json",
                    job_id: newValue
                }, {timeout: timeout_promise})
                .then(function(data){
                    // ``artifacts`` is set as a result of a promise, so we must have
                    // the watch have ``true`` as the last param to watch the value,
                    // not just the reference.  We also must check for ``blob`` in ``Job Info``
                    // because ``Job Info`` can exist without the blob as the promise is
                    // fulfilled.
                    if (data.length === 1 && _.has(data[0], 'blob')){

                        $scope.tinderbox_lines = data[0].blob.tinderbox_printlines;
                        for(var i=0; i<$scope.tinderbox_lines.length; i++){
                            var line = $scope.tinderbox_lines[i];
                            if(line.indexOf("<a href='http://graphs.mozilla.org") === 0){
                                continue;
                            }
                            var title = line;
                            var value = "";
                            var link = "";
                            var type = "";

                            var seps = [": ", "<br/>"];
                            var sep = false;

                            for(var j=0; j<seps.length; j++){
                                if(line.indexOf(seps[j]) !== -1){
                                    sep = seps[j];
                                }
                            }
                            if(sep){
                                var chunks = line.split(sep);
                                title = chunks[0];
                                value = chunks.slice(1).join(sep);
                                if(title.indexOf("link") !== -1){
                                    link = value;
                                    type = "link";
                                }

                                if(value.indexOf("uploaded") !== -1){
                                    var uploaded_to_regexp = /<a href='(http:\/\/[A-Za-z\/\.0-9\-_]+)'>([A-Za-z\/\.0-9\-_]+)<\/a>/;
                                    var uploaded_to_chunks = uploaded_to_regexp.exec(title);
                                    if(uploaded_to_chunks !== null){
                                        title = "artifact uploaded";
                                        value = uploaded_to_chunks[2];
                                        link = uploaded_to_chunks[1];
                                        type = "link";
                                    }
                                }

                                if(sep === "<br/>" || sep.indexOf("<") !== -1 || value.indexOf("<") !== -1){
                                    type="raw_html";
                                }

                                if(title === "TalosResult"){
                                    type = "TalosResult";
                                    // unescape the json string
                                    value =  value.replace(/\\/g, '');
                                    console.log(value);
                                    value = angular.fromJson(value);
                                }

                            }

                            $scope.tinderbox_lines_parsed.push({
                                title:title,
                                value:value,
                                link:link,
                                type: type
                            });
                        }
                    }

                })
                .finally(function(){
                    $scope.is_loading = false;
                });
            }
        };
        $scope.$watch("job.id", update_job_info, true);
    }
]);