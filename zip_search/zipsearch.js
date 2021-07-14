/* Copyright 2016, Chris Youderian, SimpleMaps, http://simplemaps.com
 Released under MIT license - https://opensource.org/licenses/MIT 
 */ 
(function(window, document, $){
  
  /* Edit this with simplemaps_zipsearch.html='<div style="margin-bottom: 10px;">
  <form> 
    <label for="zip">Find the closest location: </label> 
    <input type="text" id="zipsearch_zip" placeholder="Zip Code" /> 
    <button id="zipsearch_search">Go</button> 
    <span style="color: red; visibility: hidden;" id="zipsearch_error">Please enter a valid 5-digit US zip code.</span>
  </form>
</div>'; */
  var html='<div style="margin-bottom: 10px;"> \
        <form> \
          <label for="zip">Find the closest provider: </label> \
          <input type="text" id="zipsearch_zip" placeholder="Zip Code" /> \
          <button id="zipsearch_search">Go</button> \
          <span style="color: red; visibility: hidden;" id="zipsearch_error">Please enter a valid 5-digit US zip code.</span> \
        </form> \
      </div> \
  ';
  
  window.simplemaps_zipsearch=function(){
    return {html: html, map:simplemaps_usmap} 
  }()  
  
  var map_obj=window.simplemaps_zipsearch.map; /*by default uses US map, can overwrite, e.g. simplemaps_zipsearch.map=simplemaps_countymap; */
  
  function get_zip_coords(zip, callback, errors){
    var result;
    $.ajax({
      url: "https://simplemaps.com/api/geocode-zip", /*public API, for use with this script only, uptime not guaranteed */
      dataType: 'jsonp', 
      jsonp: "callback",    
      data: {
        zip: zip
      },
      success: function(response) {
        callback(response);
      },
      error: function (message) {
        errors();
      }
    });
  }

  function getDistanceFromLatLng(lat1, lng1, lat2, lng2, miles) { // miles optional
    if (typeof miles === "undefined"){miles=false;}
    function deg2rad(deg){return deg * (Math.PI/180);}
    function square(x){return Math.pow(x, 2);}
    var r=6371; // radius of the earth in km
    lat1=deg2rad(lat1);
    lat2=deg2rad(lat2);
    var lat_dif=lat2-lat1;
    var lng_dif=deg2rad(lng2-lng1);
    var a=square(Math.sin(lat_dif/2))+Math.cos(lat1)*Math.cos(lat2)*square(Math.sin(lng_dif/2));
    var d=2*r*Math.asin(Math.sqrt(a));
    if (miles){return d * 0.621371;} //return miles
    else{return d;} //return km
  }

  function get_distances_to_zip(zip_coords, locations){
    var distance_dict={};
    for (var id in locations){
      var location=locations[id];
      if (!location['lat'] || !location['lng']){continue}
      var distance=getDistanceFromLatLng(location['lat'], location['lng'], zip_coords['lat'], zip_coords['lng']);
      distance_dict[id]=distance;
    }
    return distance_dict
  }

  function get_index_of_min(obj){
    var min_i;
    for (var i in obj){
      if (!min_i){min_i=i; continue}
      if (obj[i]<obj[min_i]){min_i=i}
    }
    return min_i
  }

  function find_closest_location(zip, locations){
    
    
    function success(zip_coords){
      if (zip_coords && zip_coords['success']){
        var distances_to_zip=get_distances_to_zip(zip_coords, locations);
        var closest_location=get_index_of_min(distances_to_zip);
        var zoom_callback=function(){map_obj.popup("location", closest_location)};
        map_obj.location_zoom(closest_location, 3, zoom_callback);
      }
      else{
        errors();
      }
    }
    
    function errors(){
      var zip_error=document.getElementById("zipsearch_error");
      zip_error.style.visibility="visible";
      window.setTimeout(function(){zip_error.style.visibility="hidden";}, 1500);      
    }
    
    get_zip_coords(zip, success, errors);

  }

  $(document).ready(function(){
    var div=map_obj.mapdata.main_settings.div;
    $("#"+div).before(window.simplemaps_zipsearch.html);
    $("#zipsearch_search").click(function(e){
      e.preventDefault();
      var zip=$("#zipsearch_zip").val();
      if (zip){
        find_closest_location(zip, map_obj.mapdata.locations); 
      }
    })
  })

})(window, document, jQuery); 




