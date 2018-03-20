// TODO there is at least one bug in randomizeFleet(). Sometimes ships end up overlapped.

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

  const validateMove = (ship_name, positions, grid) => {
    for(let pos of positions) {
      if(!validateCoords(pos)) {
        return false;
      }

      let tile_contents = grid[pos[0]][pos[1]];
      if(tile_contents && tile_contents != ship_name) {
        return false;
      }
    }
    return true;
  };

  const rotateVector = (vector, axis=[0, 0]) => {
    let new_vector = vector.map(point => subCoords(point, axis));
    new_vector = new_vector.map((coords) => [coords[1], coords[0]]);
    return new_vector.map(point => addCoords(point, axis));
  };

  // const translateVector = (vector, direction) => {
  //   return vector.map(point => addCoords(point, direction));
  // };

  const teleportVector = (vector) => {
    const vector_length  = vector.length;
    const random_point   = [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)];
    const directions     = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const direction      = directions[Math.floor(Math.random() * 4)];

    const new_vector = [random_point];
    for(let i = 1; i < vector_length; i ++) {
      new_vector.push(addCoords(new_vector[i - 1], direction));
    }

    return new_vector;
  };


  const getVectorFromParts = (parts) => {
    const vector = [];
    for(let part of parts) {
      vector.push(part.coords);
    }
    return vector;
  };

  const setPartsWithVector = (parts, vector) => {
    for(let i = 0; i < parts.length; i ++) {
      parts[i].coords = vector[i];
    }
  };

  const addShipToGrid = (grid, vector, ship_key) => {
    for(let pos of vector) {
      grid[pos[0]][pos[1]] = ship_key;
    }
  };

  const randomizeFleet = (fleet) => {
    const grid = [];
    for(let x = 0; x < 10; x ++) {
      grid.push([]);
      for(let y = 0; y < 10; y ++) {
        grid[x].push('');
      }
    }

    const ship_names = [];
    for(let ship_name in fleet) {
      ship_names.push(ship_name);
      addShipToGrid(
        grid, 
        getVectorFromParts(fleet[ship_name].parts),
        ship_name
      );
    }

//     const translations = [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]];
    for(let i = 0; i < 100000; i ++) {

      let ship_name = ship_names[Math.floor(Math.random() * ship_names.length)]; 
      let vector = getVectorFromParts(fleet[ship_name].parts);

      vector = teleportVector(vector);

      // if(Math.random() < 0.2) {
      //   vector = rotateVector(vector, vector[Math.floor(vector.length / 2.0)]);
      // }
      // else {
      //   let translation = translations[Math.floor(Math.random() * 8)];
      //   vector = translateVector(vector, translation);
      // }

      if(validateMove(ship_name, vector, grid)) {
        addShipToGrid(grid, vector, ship_name);
        setPartsWithVector(fleet[ship_name].parts, vector);
      }
    }

  };

  const getInitialFleetObj    = () => {
    const ships = {
      carrier: {
        parts: [
          { coords: [0, 0] }, 
          { coords: [1, 0] }, 
          { coords: [2, 0] }, 
          { coords: [3, 0] }, 
          { coords: [4, 0] }
        ]
      },

      cruiser: {
        parts: [
          { coords: [0, 2] }, 
          { coords: [1, 2] }, 
          { coords: [2, 2] }
        ]
      },

      submarine: {
        parts: [
          { coords: [0, 4] }, 
          { coords: [1, 4] }, 
          { coords: [2, 4] }
        ]
      },

      battleship: {
        parts: [
          { coords: [0, 6] }, 
          { coords: [1, 6] }, 
          { coords: [2, 6] },
          { coords: [3, 6] }
        ]
      },

      destroyer: {
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

    randomizeFleet(ships);
    return ships;
  };

  const updateBoardFromJSON  = (desk) => {

    const $board  = $(`#${desk}`).find('.board');
    const fleet   = $board.data('fleet');
    const sea     = $board.data('sea');

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
            $tile.attr('class', `tile ${tile_index} ${part.state}`);
          }
        }
      }
    } 
    for(let tile_index of sea) {
      let $tile = $board.find(`.${tile_index}`);
      $tile.attr('class', `tile ${tile_index} miss`);
    }
  };

  const updateJSONFromBoard  = (desk) => {
    const fleet = {};
    const $desk = $(`#${desk}`);

    const $ships = $desk.find('.ship');
    $ships.each(function() {

      let $ship_part           = $(this);
      let ship_name_and_state  = 
        $ship_part.attr('class')
                  .split(/\s+/)
                  .splice(3)
                  .map(html_class => {
                    return html_class.replace('ship-', '');
                  });

      let ship_name  = ship_name_and_state[0];
      let state      = ship_name_and_state[1];

      if(!fleet[ship_name]) {        
        fleet[ship_name] = {parts: []};
      }

      fleet[ship_name].parts.push({
        coords: tileIndexToCoords($ship_part.data('index')),
        state: state
      });
    });

    $desk.find('.board').data('fleet', fleet);
  };

  const getAllUnmolested = (fleet, sea) => {
    const unmolested = [];
    for(let ship_name in fleet) {
      for(let part of fleet[ship_name].parts) {
        if(part.state === 'unharmed') {
          unmolested.push(coordsToTileIndex(part.coords));
        }
      }
    }
    for(let x = 0; x < 10; x ++) {
      for(let y = 0; y < 10; y ++) {
        let tile_index = coordsToTileIndex([x, y]);
        if(!unmolested.includes(tile_index) && !sea.includes(tile_index)) {
          unmolested.push(tile_index);
        }
      }
    }
    return unmolested;
  };


  return {
    x_indeces, 
    coordsToTileIndex,
    getInitialFleetObj,
    updateBoardFromJSON,
    updateJSONFromBoard,
    tileIndexToCoords,
    addCoords,
    subCoords,
    validateCoords,
    rotateVector,
    getAllUnmolested
  };
});
