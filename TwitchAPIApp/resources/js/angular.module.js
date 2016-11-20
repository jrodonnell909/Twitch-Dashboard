Window.CLIENT_ID = 'ca154b2vwatntjtt8g07qr5hrw2mcvi';

var app = angular.module("app", ["ngRoute"])

//
//
//
//
//
//

app.config(function ($routeProvider) {
    $routeProvider.when("/", {
        templateUrl: "./views/main.htm",
         controller: "mainCtrl"
    });
    $routeProvider.when("/login", {
       templateUrl: "./views/login.htm",
        controller: "loginCtrl"
    });
    $routeProvider.otherwise({
        redirectTo: '/'
    });
});

//
//
//
//
//
//

app.controller("mainCtrl", function($scope, TwitchService) {
    $scope.follows = null;
    TwitchService.getChannelData()
        .then(function(data) {
            $scope.follows = data;
        }).catch(function() {
            $scope.error = 'Unable to get stream data.';
        });
    //$scope.onlineStatus = 
});

// app.factory
// This service's job is to get the channel data for the user's follows and return whether or not they are live.
//
//
//
//

app.factory('TwitchService', function($q, $http) {
    
    var dataArray = [];
    
    // addToDataArray
    // 
    //
    // Param:
    //
    // Returns:
    
    var makeNameString = function(data) {
        var result = ""
        for (var i in data) {
            result = result.concat(data[i].channel.display_name + ",");
        }
        return result;
    }
    
    // extraRequests
    // Because the Twitch API only allows a certain number of channels to be retrieved from each request, this
    // function recursively sends $http requests to fetch the remaining followed channels.
    //
    // Param:     nextUrl => the nextUrl in the chain of request urls returned by the TwitchAPIRequest object.
    //              extra => number of remaining requests to make
    //              defer => the defer object to resolve
    //          dataArray => the dataArray to which to add the TwitchAPIRequest object's channel objects.
    //
    // Returns: n/a
    //
    
    var extraRequests = function(nextUrl, extra, defer, follows) {
        $http({
            method: 'GET'
          ,    url: nextUrl
          ,headers: { 'Client-ID': Window.CLIENT_ID }
        }).then(function(response) {
            follows = follows.concat(response.data.follows);
            if (extra > 0) {
                extraRequests(response.data._links.next, extra - 1, defer, follows);
            }
            else {
                defer.resolve(follows);
            }
        });
    };
    
    // initialRequest
    // This function sends $http requests for all the channels a user is following. 
    //
    // Param  : none
    //
    // Returns: A promise for an array of channel objects from the Twitch API
    //
    
    var initialRequest = function() {
        var defer  = $q.defer();
        $http({
            method: 'GET'
          ,    url: 'https://api.twitch.tv/kraken/users/Ghnjy/follows/channels?limit=50'
          ,headers: { 'Client-ID': Window.CLIENT_ID }
        }).then(function(response) {
            var follows = response.data.follows
            extraRequests(response.data._links.next, Math.floor(response.data._total/50), defer, follows);
        });
        return defer.promise
    };
    
    // getOnlineStatusRequest
    //
    //
    // Param  :
    //
    // Returns:
    //
    
    var getOnlineStatusRequest = function(channelObj) {
        return $http({
              method: 'GET'
            ,    url: 'https://api.twitch.tv/kraken/streams?channel=' + channelObj.channel.display_name
            ,headers: { 'Client-ID': Window.CLIENT_ID }
        })
    };
    
    // getChannelData
    //
    //
    // Param  :
    // 
    // Returns:
    //
    
    var getChannelData = function() {
        var defer = $q.defer();
        initialRequest()
            .then(function(response) {
                var defer2 = $q.defer()
                for (var i in response) {
                    var channelObj = response[i];
                    channelObj.stream = false;
                }
                defer2.resolve(response);
                return defer2.promise
            })
            .then(function(response) {
                var promiseArray = [];
                var channelObjs = response; // Store the response in a temporary variable so that we can resolve the promise with it after the 
                for (var i in response) {
                    promiseArray.push(getOnlineStatusRequest(response[i]));
                }
                $q.all(promiseArray).then(function(response) {
                    for (var i in channelObjs) {
                        channelObjs[i].stream = response[i].data.streams[0] ? true : false;
                    }
                    defer.resolve(channelObjs);
                });
            });
        return defer.promise;
    };
    
    return {
        getChannelData: getChannelData
    }
});