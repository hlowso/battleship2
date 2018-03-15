
define(['./util', './game'], function(util, game) {

  const setBoard = (desk) => {
    const $board     = $(`#${desk}`).find('.board');
    $board.append(`<div></div>`);

    for(let i = 0; i < 10; i ++) {
      $board.append(`<div class="x-axis"><span>${util.x_indeces.charAt(i)}</span></div>`);
    }

    for(let y = 1; y <= 10; y ++) {
      $board.append(`<div class="y-axis"><span>${y}</span></div>`);  
      for(let x = 0; x < 10; x ++) {
        $board.append(`<div class="tile ${util.x_indeces.charAt(x)}${y}"></div>`);
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

  const removeView = (view) => {
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

      removeView('zero');
    }
    return [$button, proceed];
  };

  const createPlayOnlineButton = () => {
    const     $button = $('<button class="view-zero">Play Online</button>');
    function  proceed() {
      alert('It\'s on the to do list...');
      removeView('zero');
    }
    return [$button, proceed];
  };


  // VIEW ONE BUTTONS
  const createChooseDifficultyButtons = () => {
    const level_buttons = [
      $('<button class="view-one">Easy</button>'),
      $('<button class="view-one">Hard</button>')
    ];
    
    function  generateHandler(level) {
      return function() {
        setBoard('opponent');
        // ship = new game.Ship('Carrier', 5, [0,0], 0);
        // alert(ship.getTiles());
        game.start(level);
        removeView('one');
      };
    }

    return level_buttons.map(
      ($button, i) => [$button, generateHandler(i + 1)]
    );
  };


  return {
    setBoard: setBoard,
    showOrHideButton: showOrHideButton,
    createPlayCompButton: createPlayCompButton,
    createPlayOnlineButton: createPlayOnlineButton,
    createChooseDifficultyButtons: createChooseDifficultyButtons 
  };

});

  



