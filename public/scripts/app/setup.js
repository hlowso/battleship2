
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
        printHTMLGrid('opponent');
        start(level);
        removeViewButtons('one');
      };
    }

    return level_buttons.map(
      ($button, i) => [$button, generateHandler(i + 1)]
    );
  };


  // VIEW POSITIONING EVENTS
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

  const generateDragHandler = (model) => {

    const generateGetNeighbours = ($original_tile) => {

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

      return function($tile) {
        let neighbour_class_selectors  = [];
        let index       = $tile.data('index');
        let coords      = util.tileIndexToCoords(index);
        for(let relative_coords of relative_neighbouring_coords) {
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

    return function(event) {
      const getWouldBeShip  = generateGetNeighbours($(this));
      event.preventDefault();
      $(window).on('mouseup', generateDropHandler(model));
      $('.tile').on('mouseenter', function() {

        const would_be_tiles = getWouldBeShip($(this));
        if(validateNewPosition(model, would_be_tiles)) {
          moveShip(model, would_be_tiles);
        }
      });
    };
  };

  const generateDropHandler = (model) => {
    return function() {
      $('.tile').off('mouseenter');
      $(window).off('mouseup');
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

  



