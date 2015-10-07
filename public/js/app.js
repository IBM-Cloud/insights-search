// Licensed under the Apache License. See footer for details.

// listen for request sent over XHR and automatically show/hide spinner
(function () {
  angular.module('ngLoadingSpinner', ['angularSpinners', 'angular-clipboard', '720kb.socialshare', 'ui-notification' ])
    .config(function(NotificationProvider) {
      NotificationProvider.setOptions({
        positionX: 'center',
        positionY: 'top'
      });
    })
    .directive('spinner', ['$http', 'spinnerService', function ($http, spinnerService) {
      return {
        link: function (scope, elm, attrs) {
          scope.isLoading = function () {
            return $http.pendingRequests.length > 0;
          };
          scope.$watch(scope.isLoading, function (loading) {
            if (loading) {
              spinnerService.show('spinner');
            } else {
              spinnerService.hide('spinner');
            }
          });
        }
      };
    }]);
}).call(this);

// angular app initialization
var app = angular.module('app', ['ngNumeraljs', 'ngLoadingSpinner']);

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})
//------------------------------------------------------------------------------
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//------------------------------------------------------------------------------
