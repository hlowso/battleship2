define(function() {

  const x_indeces             = 'ABCDEFGHIJ';
  const coordsToTileIndex     = (coords) => { 

    return `${x_indeces.charAt(coords[0])}${coords[1] + 1}`;
  };

  const tileIndexToCoords     = (tile_index) => {

    return [x_indeces.indexOf(tile_index.charAt(0)), tile_index.match(/\d+/)[0] - 1];
  };

  const addCoords             = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const subCoords             = (a, b) => [a[0] - b[0], a[1] - b[1]];

  const validateCoords        = (coords) => {
    return (coords[0] >= 0 && 
            coords[0] < 10 &&
            coords[1] >= 0 &&
            coords[1] < 10
          );
  };

  const getInitialFleetObj    = () => {
    ships = {
      carrier: {
        model: 'Carrier',
        parts: [
          { coords: [0, 0] }, 
          { coords: [1, 0] }, 
          { coords: [2, 0] }, 
          { coords: [3, 0] }, 
          { coords: [4, 0] }
        ]
      },

      cruiser: {
        model: 'Cruiser',
        parts: [
          { coords: [0, 2] }, 
          { coords: [1, 2] }, 
          { coords: [2, 2] }
        ]
      },

      submarine: {
        model: 'Submarine',
        parts: [
          { coords: [0, 4] }, 
          { coords: [1, 4] }, 
          { coords: [2, 4] }
        ]
      },

      battleship: {
        model: 'Battleship',
        parts: [
          { coords: [0, 6] }, 
          { coords: [1, 6] }, 
          { coords: [2, 6] },
          { coords: [3, 6] }
        ]
      },

      destroyer: {
        model: 'Destroyer',
        parts: [
          { coords: [0, 8] }, 
          { coords: [1, 8] }
        ]
      }

    };

    for(let key in ships) {
      for(let part of ships[key].parts) {
        part.state = 'unharmed';
      }
    }

    return ships;
  };

  const updateBoardFromJSON  = (desk) => {

    const $board  = $(`#${desk}`).find('.board');
    const fleet   = $board.data('fleet');
    if(desk === 'player') {
      for(let key in fleet) {
        for(let part of fleet[key].parts) {
          let tile_index = coordsToTileIndex(part.coords);
          let $tile = $board.find(`.${tile_index}`);
          $tile.data('ship', `${key}`);
          $tile.attr('class', `tile ${tile_index} ship ship-${key} ship-${part.state}`);
        }
      } 
    }
    else {
      for(let key in fleet) {
        for(let part of fleet[key].parts) {
          if(part.state !== 'unharmed') {
            let tile_index = coordsToTileIndex(part.coords);
            let $tile = $board.find(`.${tile_index}`);
            $tile.attr('class', `tile ${part.state}`);
          }
        }
      }
    } 
  };

  return {
    x_indeces: x_indeces, 
    coordsToTileIndex: coordsToTileIndex,
    getInitialFleetObj: getInitialFleetObj,
    updateBoardFromJSON: updateBoardFromJSON,
    tileIndexToCoords: tileIndexToCoords,
    addCoords: addCoords,
    subCoords: subCoords,
    validateCoords: validateCoords
  };
});
