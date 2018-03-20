
define(['./util'], function(util) {

  // AI
  const move = (level) => {
    const $board = $('#player').find('.board');

    switch(level) {
      case 1: 
        easyMove($board);
        break;
    }

    util.updateBoardFromJSON('player');
    let win = checkWin($board.data('fleet'));
    if(win) {
      alert('comp won');
    }
    else {
      computerPlay(level, 'player');
    }
  };

  const easyMove = ($board) => {
    const fleet             = $board.data('fleet');
    const sea               = $board.data('sea');
    const possible_targets  = util.getAllUnmolested(fleet, sea);
    attemptAttack($board, possible_targets[Math.floor(Math.random() * possible_targets.length)]);
  };

  const checkSunk = (fleet, ship_name) => {
    const ship = fleet[ship_name];
    if(ship.parts.find(part => part.state !== 'hit')) {
      return false;
    }
    for(let part of ship.parts) {
      part.state = 'sunk';
    }
    return true;
  };

  const checkWin = (fleet) => {
    for(let ship_name in fleet) {
      for(let part of fleet[ship_name].parts) {
        if(part.state !== 'sunk') {
          return false;
        }
      }
    }
    return true;
  };

  const attemptAttack = ($board, index) => {
    const fleet = $board.data('fleet');
    const sea   = $board.data('sea');

    for(let ship_name in fleet) {
      for(let part of fleet[ship_name].parts) {

        //console.log(part.coords, util.tileIndexToCoords(index));

        if(part.coords.toString() === util.tileIndexToCoords(index).toString()) {

          //console.log('found ship with coords');

          if(part.state === 'unharmed') {
            part.state = 'hit';
            checkSunk(fleet, ship_name);
            $board.data('fleet', fleet);
            return true;
          }
          return false;
        }
      } 
    }
    //console.log('did not find ship with coords');
    if(sea.includes(index)) {
      return false;
    }
    sea.push(index);
    $board.data('sea', sea);
    return true;
  };

  // PLAYER MOVES
  const getBoardClickHandler = ($board) => {
    return function(event) {
      const index   = $(event.target).data('index');
      const change  = attemptAttack($board, index);
      if(change) {
        toggleOpponentBoardState(false);
        util.updateBoardFromJSON('opponent');
        let win = checkWin($board.data('fleet'));
        if(win) {
          alert('You win!');
        }
        else {
          let level = $('#opponent').data('level');
          if(level === 'online') {

          }
          else {
            computerPlay(level, 'computer');
          }
        }
      }
    };
  };

  const toggleOpponentBoardState = (on=true) => {
    const $board = $('#opponent').find('.board');
    if(on) {
      $board.on('click', getBoardClickHandler($board)); 
    }
    else {
      $board.off('click');
    }
  };

  const computerPlay = (level, player_to_move) => {
    if(player_to_move === 'player') {
      toggleOpponentBoardState();
    }
    else {
      setTimeout(() => move(level), 1000);
    }
  };

  const start = (level, first_player) => {
    if(level === 'online') {
      onlinePlay(first_player);
    }
    else {
      computerPlay(level, first_player);
    }
  };

  const onlinePlay = (first_player) => {

  };

  return {
    start
  };
});