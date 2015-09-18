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