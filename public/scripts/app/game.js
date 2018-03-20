
define(['./util'], function(util) {

  const move = (level) => {
    switch(level) {
      case 1: 
        easyMove();
        break;
    }
  };

  const easyMove = () => {

  };

  const toggleOpponentBoardState = (on=true) => {
    // for(let l of util.x_indeces) {
    //   for(let y = 1; y <= 10; y ++) {

    //   }
    // }
    const $board = $('#opponent').find('.board');
    debugger;

    if(on) {
      $board.on('click', function(event) {
        debugger;
      }); 
    }
    else {
      $board.off('click');
    }
  };

  const computerPlay = (level, player_to_move) => {
    if(player_to_move === 'player') {
      toggleOpponentBoardState();
      toggleOpponentBoardState(false);
    }
    else {
      move(level);
    }
  };

  const onlinePlay = (first_player) => {

  };
  
  const start = (level, first_player) => {

    debugger;

    if(level === 'online') {
      onlinePlay(first_player);
    }
    else {
      computerPlay(level, first_player);
    }
  };

  return {
    start
  };
});