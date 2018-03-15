
define(['./util'], function(util) {

  class Ship {
    constructor(model, length, bow_coords, orientaion) {

      this.model   = model;
      this.coords  = [];
      this.tiles   = [];

      for(let i = 0; i < length; i ++) {
        this.coords.push(bow_coords);
        this.tiles.push(
          util.coordsToTileIndex(bow_coords)
        );
        bow_coords[orientaion] ++;
      }

    }

    getTiles() {
      return this.tiles;
    }
   
  }
  
  const start = (level) => {
    $('.board').each(function(index){
      $(this).data('board', util.getInitialBoard());
    });
  };

  return {
    start: start
  };

});