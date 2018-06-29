//these are the main variables
var map;
var MapBounds;
var MapsInfoWindow;

//this is the position that the map will open up, when the user opens the website.
//it will open up with a 25 zoom.
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 51.227741, lng: 6.773456},
      zoom: 25
    });
    MapBounds = new google.maps.LatLngBounds();
    MapsInfoWindow = new google.maps.InfoWindow();
    ko.applyBindings(new FilterFunction());
}

//this code handles a google maps error. If google maps fails to work, an alert will pop up notifying the user.
function googleMapsError() {
    alert('Sorry, Google maps is not working because of an error that occured.');
}

/* Location Model */

var location_marker = function(location_data) {
    var self = this;

    this.title = location_data.title;
    this.position = location_data.location;


    this.visible = ko.observable(true);
    // this adds a colour to the marker. This is the colour the user will see when they don't
       //scroll over the marker with their mouse.
       var standardIcon = makeMarkerIcon('8E44AD');
       // when the user scrolls over the marker, the marker will become a neon pink colour
       var mousedOverIcon = makeMarkerIcon('FF69B4');


       //here the foursquare data will be loaded onto the info window
       //I found the link below on this website: https://developer.foursquare.com/docs/api/venues/search.
    var foursquareLoadURL = 'https://api.foursquare.com/v2/venues/search?ll=' + this.position.lat + ',' + this.position.lng + '&client_id=' + 'SUJSPHKTGUE2KPW2AJY2SMAID5CGR10BMF4CKAEQ2S4Q1UCV' + '&client_secret=' + 'VESP3REYEVGYK3KFGV53UTZM3HIUUWFJI3CLWFIXFKJ252AI' + '&v=20160118' + '&query=' + this.title;

    $.getJSON(foursquareLoadURL).done(function(location_data) {
		var results = location_data.response.venues[0];
        self.street = results.location.formattedAddress[0] ? results.location.formattedAddress[0]: 'No street name found.';
        self.city = results.location.formattedAddress[1] ? results.location.formattedAddress[1]: 'No city name found.';
    }).fail(function() {
        alert('Sorry, there was an error with Foursquare.');
    });

    //the DROP is an animation from google maps which allows the markers to drop down onto the page when a user refreshes the page
    //this source (https://developers.google.com/maps/documentation/javascript/examples/marker-animations) helped me figure this out.
    this.marker = new google.maps.Marker({
        position: this.position,
        title: this.title,
        animation: google.maps.Animation.DROP,
        icon: standardIcon
    });


    self.filterMarkers = ko.computed(function () {
        // set marker and extend bounds (showListings)
        if(self.visible() === true) {
            self.marker.setMap(map);
            MapBounds.extend(self.marker.position);
            map.fitBounds(MapBounds);
        } else {
            self.marker.setMap(null);
        }
    });

// this filters through the locations on my map
    this.marker.addListener('click', function() {
        populateInfoWindow(this, self.street, self.city, MapsInfoWindow);
    });

    // This allows the colours of the markers to change when a user is scrolling over a marker with their mouse
    this.marker.addListener('mouseover', function() {
        this.setIcon(mousedOverIcon);
    });
    this.marker.addListener('mouseout', function() {
        this.setIcon(standardIcon);
    });


    //this shows the markers information when it is located from the list
     //I looked more into the .trigger and .triggerhandler on this website: http://api.jquery.com/trigger/.
    this.show = function(location) {
        google.maps.event.trigger(self.marker, 'click');
    };

};

// This function allows the info window to display the important information for example the name of the restauraunt and its exact location.
function populateInfoWindow(marker, street, city, MapsInfoWindow) {
    if (MapsInfoWindow.marker != marker) {
        MapsInfoWindow.marker = marker;
        MapsInfoWindow.addListener('closeclick', function() {
            MapsInfoWindow.marker = null;
        });
        //This is the main title, h2 makes the title larger
        MapsInfoWindow.setContent('<div>' + '<h2>' + 'Restaurant: ' + marker.title + '</h2>' + '</br>' + 'Position: ' + marker.position + '<p>' + street + "<br>" + city + "</p>" + '</div>');
        MapsInfoWindow.open(map, marker);
    }
}

//I used knockout documentation to figure out what an observable array is (http://knockoutjs.com/documentation/observables.html)
var FilterFunction = function() {
    var self = this;
    this.searchItem = ko.observable('');
    this.mapList = ko.observableArray([]);
    locations.forEach(function(location) {
        self.mapList.push( new location_marker(location) );
    });
    this.locationList = ko.computed(function() {
        var searchFilter = self.searchItem().toLowerCase();
        if (searchFilter) {
            return ko.utils.arrayFilter(self.mapList(), function(location) {
                var str = location.title.toLowerCase();
                var result = str.includes(searchFilter);
                location.visible(result);
				return result;
			});
        }
        self.mapList().forEach(function(location) {
            location.visible(true);
        });
        return self.mapList();
    }, self);
};


// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}
