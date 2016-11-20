Window.CLIENT_ID = 'ca154b2vwatntjtt8g07qr5hrw2mcvi';

Twitch.init({
    clientId: Window.CLIENT_ID
}, function (error, status) {
    if (error) {
        // error encountered while loading
        console.log(error);
    }
    // the sdk is now loaded
    if (status.authenticated) {
        // user is currently logged in
        $('.twitch-connect').hide();
        console.log('Authenticated');
    }
});

var totalFollowers;

function addToArray(data, follows) {
    for (i = 0; i < data.follows.length; i++) {
        follows.push(data.follows[i].channel.display_name);
    }
}

function makeHTLMList(follows) {
    for (i = 0; i < follows.length; i++) {
        $("#follow-list").append("<li>" + follows[i] + "</li>");
    }
}

function extraRequests(nextURL, _ExtraRequests, follows) {
    $.ajax({
        type: 'GET'
        , url: nextURL
        , headers: {
            'Client-ID': Window.CLIENT_ID
        }
    , }).done(function (data) {
        addToArray(data, follows);
        if (_ExtraRequests > 0) {
            extraRequests(data._links.next, _ExtraRequests - 1, follows);
        }
        else {
            makeHTLMList(follows);
        }
    });
}

// Initial request. Also determines how many more requests to make.
$.ajax({
    type: 'GET'
    , url: 'https://api.twitch.tv/kraken/users/Ghnjy/follows/channels?limit=50'
    , headers: {
        'Client-ID': Window.CLIENT_ID
    }
, }).done(function (data) {
    var follows = [];
    var totalFollows = data._total;
    numExtraRequests = Math.floor(totalFollows / 50);
    addToArray(data, follows);
    extraRequests(data._links.next, numExtraRequests, follows);
});