$(document).ready(function(){
  initialize();
  draw();
  
  $("#addtree").click(function(){
    hidePanel($("#aboutpanel"));
    showPanel($("#addpanel"));
  });
  
  $("#about").click(function(){
    showPanel($("#aboutpanel"));
    hidePanel($("#addpanel"));
  });
  
  $("#submit").click(createMarker);
  $("#cancel").click(reset);
  
});

function showPanel(x){
  x.stop().animate({right: '0px'});
}

function hidePanel(x){
  x.stop().animate({right: '-305px'});
}

var initialLocation = new google.maps.LatLng(37.884778,-122.297144);
var browserSupportFlag =  new Boolean();
var map;
  
function initialize() {
  var myOptions = {
    zoom: 13,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
  
  // Try W3C Geolocation method (Preferred)
  if(navigator.geolocation) {
    browserSupportFlag = true;
    navigator.geolocation.getCurrentPosition(function(position) {
      initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
      contentString = "Location found using W3C standard";
      map.setCenter(initialLocation);
    }, function() {
      handleNoGeolocation(browserSupportFlag);
    });
  } else if (google.gears) {
    // Try Google Gears Geolocation
    browserSupportFlag = true;
    var geo = google.gears.factory.create('beta.geolocation');
    geo.getCurrentPosition(function(position) {
      initialLocation = new google.maps.LatLng(position.latitude,position.longitude);
      contentString = "Location found using Google Gears";
      map.setCenter(initialLocation);
    }, function() {
      handleNoGeolocation(browserSupportFlag);
    });
  } else {
    // Browser doesn't support Geolocation
    browserSupportFlag = false;
    handleNoGeolocation(browserSupportFlag);
  }
}
 
function handleNoGeolocation(errorFlag) {
  map.setCenter(initialLocation);
}


function draw() {
  $.getJSON('/list', function(data){
    for (var i in data) {
      (function(i){
        setTimeout(function() {
          var pos = new google.maps.LatLng(data[i].location.lat, data[i].location.lng);
          drawMarker(data[i].fruit, pos, data[i].description, data[i].id, false);
        }, i * 200);
      })(i)
    }
  });
}

function getIcon(fruit, mine) {
  var ext = '.png';
  if(mine) {
    ext = '1'+ext;
  }
  var file;
  switch(fruit) {
    case 'Lemon':
      file = 'lemon';
      break;
    case 'Apple':
      file = 'apple';
      break;
    case 'Cherry':
      file = 'cherry';
      break;
    case 'Grape':
      file = 'grape';
      break;
    case 'Orange':
      file = 'orange';
      break;
    case 'Lime':
      file = 'lime';
      break;
    case 'Peach':
      file = 'peach';
      break;
    case 'Plum':
      file = 'plum';
      break;
    default:
      file = 'other'
  }
  
  return 'images/' + file + ext;
}

function toggleBounce(marker) {
  if (marker.getAnimation() != null) {
    marker.setAnimation(null);
  } else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
  }
}

function createMarker() {

  var id = ("" + Math.random()).substring(2);
  var fruit = $('#fruit').val();
  var desc = $('#desc').val();
  var p = map.getCenter();
  
  reset();
  
  $.cookie(id, true, 365);
  
  drawMarker(fruit, map.getCenter(), desc, id, true);  
  
  $.post('/new', {id: id, lat: p.lat(), lng: p.lng(), desc: desc, fruit: fruit});
}

function reset () {
  $('#fruit').val("Apple");
  $('#desc').val("");
  hidePanel($("#addpanel"));
}

function drawMarker(fruit, pos, description, id, open) {
  var mine = $.cookie(id) !== null;
  
  var marker = new google.maps.Marker({
    map: map,
    draggable: mine,
    animation: google.maps.Animation.DROP,
    icon: getIcon(fruit, mine),
    position: pos
  });
  
  var infowindow = new google.maps.InfoWindow({
      content: '<h3>' + fruit + ' tree</h3>' + '<p>' + description + '</p>'
  });
  
  if(open) {
    infowindow.open(map, marker);  
  }
  
  google.maps.event.addListener(marker, 'click', function(){
    infowindow.open(map,marker);
  });
  
  if(mine) {
    google.maps.event.addListener(marker, 'dragend', function(){
      // Update
      var p = marker.getPosition();
      $.post('/update', {id: id, lat: p.lat(), lng: p.lng()});
    });
  }
}