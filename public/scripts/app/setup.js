// TODO dodgy behaviour occurs when a ship is dragged off the board


define(['./util', './game'], function(util, game) {

  const printHTMLGrid = (desk) => {
    const $board     = $(`#${desk}`).find('.board');
    $board.append(`<div></div>`);

    for(let i = 0; i < 10; i ++) {
      $board.append(`<div class="x-axis"><span>${util.x_indeces.charAt(i)}</span></div>`);
    }

    for(let y = 1; y <= 10; y ++) {
      $board.append(`<div class="y-axis"><span>${y}</span></div>`);  
      for(let x = 0; x < 10; x ++) {
        let index = `${util.x_indeces.charAt(x)}${y}`;
        let $tile = $(`<div class="tile ${index}"></div>`);
        $tile.data('index', index);
        $board.append($tile);
      }
    }
  };

  const showOrHideButton = ($button, callback=null) => {
    if(callback) {
      $button.show();
      $button.on('click', callback);
    }
    else {
      $button.off();
      $button.hide();
    }
  };

  const removeViewButtons = (view) => {
    $(`.view-${view}`).each(function(index) {
      showOrHideButton($(this));
    });
  };


  // VIEW ZERO BUTTONS
  const createPlayCompButton = () => {
    const     $button = $('<button class="view-zero">Play Computer</button>');
    function  proceed() {
      
      const next_set = createChooseDifficultyButtons();
      for(let next of next_set) {
        $('#opponent').append(next[0]);
        showOrHideButton(next[0], next[1]);
      }

      removeViewButtons('zero');
    }
    return [$button, proceed];
  };

  const createPlayOnlineButton = () => {
    const     $button = $('<button class="view-zero">Play Online</button>');
    function  proceed() {
      alert('It\'s on the to do list...');
      removeViewButtons('zero');
    }
    return [$button, proceed];
  };


  // VIEW ONE BUTTONS
  const createChooseDifficultyButtons = () => {
    const level_buttons = [
      $('<button class="view-one">Easy</button>'),
      $('<button class="view-one">Hard</button>')
    ];
    
    function generateHandler(level) {
      return function() {
        printPositioningInstructions();
        start(level);
        removeViewButtons('one');
      };
    }

    return level_buttons.map(
      ($button, i) => [$button, generateHandler(i + 1)]
    );
  };


  // VIEW POSITIONING EVENTS
  const printPositioningInstructions = () => {
    const p = $('<p>Drag and drop ships to reposition.<br> Rotate selection with \'R\'.</p>');
    $('#opponent').append(p);
  };

  const createReadyButton = () => {
    const     $button = $('<button class="view-positioning">Ready</button>');
    function  proceed() {
      game.start();
      removeViewButtons('positioning');
    }
    return [$button, proceed];
  };

  const validateNewPosition = (model, $tiles) => {
    if(!$tiles) {
      return false;
    }

    let valid = true;
    $tiles.each(function() {
      if($(this).hasClass('ship') && $(this).data('ship') !== model) {
        valid = false;
      }
    });
    return valid;
  };

  const moveShip = (model, new_tiles) => {

    const $old_tiles       = $(`.ship-${model}`);
    const ship_class_sets  = [];

    $old_tiles.each(function() {
      ship_class_sets.push(
      $(this)
        .attr('class')
        .split(/\s+/)
        .filter(tile_class => /ship/.test(tile_class))
        .join(' ')
      );

      $(this).attr('class', `tile ${$(this).data('index')}`);
    });

    for(let i = 0; i < new_tiles.length; i ++) {
      let $new_tile = $(new_tiles[i]);
      $new_tile.data('ship', model);
      $new_tile.addClass(ship_class_sets[i]);
    }
  };

  const rotateVectorAboutOrigin = (vector) => {

    return vector.map((coords) => [coords[1], coords[0]]);
  };


  const generateGetNewTiles = ($original_tile) => {

    const index                         = $original_tile.data('index');
    const coords                        = util.tileIndexToCoords(index);
    const $ship                         = $(`.ship-${$original_tile.data('ship')}`);
    const relative_neighbouring_coords  = [];

    $ship.each(function() {
      let neighbouring_index   = $(this).data('index');
      let neighbouring_coords  = util.tileIndexToCoords(neighbouring_index);
      relative_neighbouring_coords.push(
        util.subCoords(neighbouring_coords, coords)
      );
    });

    const relative_rotated_coords       = rotateVectorAboutOrigin(relative_neighbouring_coords);

    return function($tile, rotate=false) {

      let coords_set                  = (rotate) ? relative_rotated_coords : relative_neighbouring_coords;
      let neighbour_class_selectors   = [];
      let index                       = $tile.data('index');
      let coords                      = util.tileIndexToCoords(index);

      for(let relative_coords of coords_set) {
        let new_coords = util.addCoords(coords, relative_coords);
        if(!util.validateCoords(new_coords)) {
          return null;
        }
        neighbour_class_selectors.push(
          '.' + util.coordsToTileIndex(new_coords)
        );
      }
      return $('#player').find(neighbour_class_selectors.toString());
    };
  };

  const generateDragHandler = (model) => {


    return function(event) {
      const getNewTiles = generateGetNewTiles($(this));
      event.preventDefault();
      const prepareTilesForMoves = (newTilesGetter) => {
 
        $('.tile').off('mouseenter');
        $('.tile').on('mouseenter', function() {

          $('#cursor').removeAttr('id');
          $(this).attr('id', 'cursor');
          const new_tiles = newTilesGetter($(this));
          if(validateNewPosition(model, new_tiles)) {
            moveShip(model, new_tiles);
          }
        });

        prepareTilesForRotation(newTilesGetter);
      };

      const prepareTilesForRotation = (newTilesGetter) => {
        $(document).off('keydown');
        $(document).on('keydown', function(event) {
      
          if(event.which === 82) {
            const $center_tile  = $('#cursor'); 
            const new_tiles     = newTilesGetter($center_tile, true);
            if(validateNewPosition(model, new_tiles)) {
              moveShip(model, new_tiles);
              prepareTilesForMoves(generateGetNewTiles($center_tile));
            }
          }
        });
      };

      $(window).on('mouseup', generateDropHandler(model));
      prepareTilesForMoves(getNewTiles);
    };
  };

  const generateDropHandler = (model) => {
    return function() {
      $(window).off('mouseup');
      $('.tile').off('mouseenter');
      $(document).off('keydown');

      $(`.ship-${model}`).each(function() {
        let dragHandler = generateDragHandler(model).bind(this); 
        $(this).on('mousedown', function(event) {
          dragHandler(event);
          $(this).off('mousedown');
        });
      });
    };
  };

  const activateOrDeactivateShipDragAndDrop = (activate=true) => {

    $('.ship').each(function() {
      let $ship_part   = $(this);
      let model        = $ship_part.data('ship');
      let dragHandler  = generateDragHandler(model).bind(this);

      $ship_part.on('mousedown', function(event) {
        dragHandler(event);
        $(this).off('mousedown');
      });
    });
  };



  const start = (level) => {
    $('#opponent').data('level', level);

    $('.board').each(function() {
      $(this).data('fleet', util.getInitialFleetObj());
    });

    util.updateBoardFromJSON('player');
    activateOrDeactivateShipDragAndDrop();

  };


  return {
    printHTMLGrid: printHTMLGrid,
    showOrHideButton: showOrHideButton,
    createPlayCompButton: createPlayCompButton,
    createPlayOnlineButton: createPlayOnlineButton,
    createChooseDifficultyButtons: createChooseDifficultyButtons 
  };

});

  



