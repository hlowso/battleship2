define(function() {

  x_indeces          = 'ABCDEFGHIJ';
  coordsToTileIndex  = (coords) => {
    return `${x_indeces.charAt(coords[0])}${coords[1] + 1}`;
  };

  getInitialBoard    = () => {
    return {
      model: 'Carrier'
    };
  };


  return {
    x_indeces: x_indeces, 
    coordsToTileIndex: coordsToTileIndex,
    getInitialBoard: getInitialBoard 
  };
});
