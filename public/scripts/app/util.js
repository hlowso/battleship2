define(function() {

  const x_indeces          = 'ABCDEFGHIJ';
  const coordsToTileIndex  = (coords) => {
    return `${x_indeces.charAt(coords[0])}${coords[1] + 1}`;
  };

  const getInitialFleetObj = () => {
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

  const displayBoard = (desk) => {
    
  };




  return {
    x_indeces: x_indeces, 
    coordsToTileIndex: coordsToTileIndex,
    getInitialFleetObj: getInitialFleetObj,
    displayBoard: displayBoard
  };
});
