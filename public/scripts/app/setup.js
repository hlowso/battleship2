// TODO dodgy behaviour occurs when a ship is dragged off the board

define(['./util', './game'], function(util, game) {

  const printHTMLGrid = (desk) => {
    const $board     = $(`#${desk}`).find('.board');
    $board.append(`<div></div>`);

    for(let i = 0; i < 10; i ++) {
      $board.append(`<div class="x-axis">${util.x_indeces.charAt(i)}</div>`);
    }

    for(let y = 1; y <= 10; y ++) {
      $board.append(`<div class="y-axis">${y}</div>`);  
      for(let x = 0; x < 10; x ++) {
        let index = `${util.x_indeces.charAt(x)}${y}`;
        let $tile = $(`<div class="tile ${index}"></div>`);
        $tile.data('index', index);
        $board.append($tile);
      }
    }
  };

  const showOrRemoveButton = ($button, callback=null, $where=null) => {
    if(callback) {
      $where.prepend($button);
      $button.show();
      $button.on('click', callback);
    }
    else {
      $button.off();
      $button.remove();
    }
  };

  const removeViewButtons = (view) => {
    $(`.view-${view}-button`).each(function() {
      showOrRemoveButton($(this));
    });
  };

  const removeView = (view) => {
    removeViewButtons(view);
    $(`.view-${view}`).each(function() {
      $(this).remove();
    });
  };


  // VIEW ZERO BUTTONS
  const createPlayCompButton = () => {
    const     $button = $('<button class="view-zero-button">Play Computer</button>');
    function  proceed() {
      
      //$('#opponent').find('.board').data('fleet', util.getInitialFleetObj());
      const next_set = createChooseDifficultyButtons();
      for(let next of next_set) {
        showOrRemoveButton(next[0], next[1], $('#opponent'));
      }

      removeViewButtons('zero');
    }
    return [$button, proceed];
  };

  const createPlayOnlineButton = () => {
    const     $button = $('<button class="view-zero-button">Play Online</button>');
    function  proceed() {
      $('#opponent').data('level', 'online');
      goToLobby();
    }
    return [$button, proceed];
  };


  // VIEW ONE-COMP BUTTONS
  const createChooseDifficultyButtons = () => {
    const level_buttons = [
      $('<button class="view-one-button">Easy</button>'),
      $('<button class="view-one-button">Hard</button>')
    ];
    
    function generateHandler(level) {
      return function() {
        $('#opponent').data('level', level);
        beginPositioningPhase();
        removeViewButtons('one');
      };
    }

    return level_buttons.map(
      ($button, i) => [$button, generateHandler(i + 1)]
    );
  };

  // ONLINE WAITING ROOM
  const addMeToLobby = (username, $lobby) => {
    const ws = new WebSocket(util.WEBSOCKET_URL);
    ws.onopen = data => {
      console.log('Connected over here!');
    };

    $('#player').data('name', username);
    $lobby.find('p').text('Added to lobby. Now waiting for opponent...');
    $lobby.find('input').remove();
    $lobby.on('hidden.bs.modal', function(event) {
      ws.close();
    });
  };

  const goToLobby = () => {
    const $lobby = util.createModal('lobby', `
      <h3>Lobby</h3>
    `, `
      <p>Enter a username to join the lobby.</p>
      <input placeholder="..."> 
    `);

    $lobby.find('input').on('keypress', function(event) {
      if(event.key === 'Enter') {
        const username = util.escape(event.target.value);
        if(!username) {
          alert('field must not be left empty');
        }
        else {
          addMeToLobby(username, $lobby);
        }
      }
    });

    $lobby.modal();
  };

  // VIEW POSITIONING EVENTS
  const printPositioningInstructions = () => {
    const p = $('<p class="view-positioning">Drag and drop ships to reposition.<br> Rotate selection with \'R\'.</p>');
    $('#opponent').append(p);
  };

  const createReadyButton = () => {
    const     $button = $('<button class="view-positioning-button">Ready</button>');
    function  proceed() {
      activateOrDeactivateShipDragAndDrop(false);
      removeView('positioning');
      util.updateJSONFromBoard('player');
      postPositioning();
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

    const relative_rotated_coords       = util.rotateVector(relative_neighbouring_coords);

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
      $('#cursor').removeAttr('id');
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

    if(activate) {
      $('.ship').each(function() {
        let $ship_part   = $(this);
        let model        = $ship_part.data('ship');
        let dragHandler  = generateDragHandler(model).bind(this);

        $ship_part.on('mousedown', function(event) {
          dragHandler(event);
          $(this).off('mousedown');
        });
      });
    }
    else {
      $('.ship').each(function() {
        $(this).off('mousedown');
      });
    }
  };

  const beginPositioningPhase = () => {
    const ready_button = createReadyButton();
    $('.board').each(function() {
      $(this).data('fleet', util.getInitialFleetObj());
      $(this).data('sea', []);
    });

    util.updateBoardFromJSON('player');
    printPositioningInstructions();
    activateOrDeactivateShipDragAndDrop();
    showOrRemoveButton(ready_button[0], ready_button[1], $('#opponent'));

  };


  // VIEW POST-POSITIONING EVENTS
  const printChoiceInstructions = () => {
    const p = $('<p class="view-post-positioning">Who goes first?</p>');
    $('#opponent').append(p);
  };

  const showChooseFirstButtons = (level) => {
    const buttons = [
      $('<button id="random-first-player" class="view-post-positioning-button">Randomize</button>'),
      $('<button id="your-choice" class="view-post-positioning-button">Your Choice</button>')
    ];

    function proceedRandom() {
      removeView('post-positioning');
      printHTMLGrid('opponent');
      game.start(level, (Math.random() < 0.5) ? 'player' : 'opponent');
    }

    function proceedChoice() {
      removeView('post-positioning');
      const buttons = [
        $('<button class="view-choice-button">You</button>'),
        $('<button class="view-choice-button">Computer</button>')
      ];

      const getProcedure = (who) => {
        return function() {
          removeView('choice');
          printHTMLGrid('opponent');
          game.start(level, who);
        };
      };

      showOrRemoveButton(buttons[0], getProcedure('player'), $('#opponent'));
      showOrRemoveButton(buttons[1], getProcedure('opponent'), $('#opponent'));
    }

    showOrRemoveButton(buttons[0], proceedRandom, $('#opponent'));
    showOrRemoveButton(buttons[1], proceedChoice, $('#opponent'));
  };

  const postPositioning = () => {           
    const level = $('#opponent').data('level');
    if(level === 'online') {
      game.start('online');
    }
    else {
      showChooseFirstButtons(level);
    }
  };


  return {
    printHTMLGrid: printHTMLGrid,
    showOrRemoveButton: showOrRemoveButton,
    createPlayCompButton: createPlayCompButton,
    createPlayOnlineButton: createPlayOnlineButton,
    createChooseDifficultyButtons: createChooseDifficultyButtons 
  };

});

  



