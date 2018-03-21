
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
    attemptAttack($board, possible_targets[Math.floor(Math.random() * possible_targets.length)], 'computer');
  };

  const addToShipGraveyard = (ship_name, player=true) => {
    let $grave;
    if(player) {
      $grave = $('#opponent').find(`.${ship_name}-grave`);
    }
    else {
      $grave = $('#player').find(`.${ship_name}-grave`);
    }
    $grave.html(ship_name);
  };

  const checkSunk = (fleet, ship_name, who) => {
    const ship = fleet[ship_name];
    if(ship.parts.find(part => part.state !== 'hit')) {
      return false;
    }
    for(let part of ship.parts) {
      part.state = 'sunk';
    }
    logMessage(who, `has sunk the ${ship_name}!`);
    addToShipGraveyard(ship_name, (who === 'player'));
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

  const attemptAttack = ($board, index, who) => {
    const fleet = $board.data('fleet');
    const sea   = $board.data('sea');

    for(let ship_name in fleet) {
      for(let part of fleet[ship_name].parts) {

        //console.log(part.coords, util.tileIndexToCoords(index));

        if(part.coords.toString() === util.tileIndexToCoords(index).toString()) {

          //console.log('found ship with coords');

          if(part.state === 'unharmed') {
            part.state = 'hit';
            logMessage(who, `fires at ${index}: HIT`);
            checkSunk(fleet, ship_name, who);
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
    logMessage(who, `fires at ${index}: MISS`);
    return true;
  };

  // PLAYER MOVES
  const getBoardClickHandler = ($board) => {
    return function(event) {
      if($(event.target).prop('tagName') !== 'SPAN') {
        const index   = $(event.target).data('index');
        const change  = attemptAttack($board, index, 'player');
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

  const toggleNameHighlights = (player=true) => {
    let $playing, $waiting;
    const $player = $('#player').find('.name');
    const $opponent = $('#opponent').find('.name');
    if(player) {
      $playing = $player;
      $waiting = $opponent;
    }
    else {
      $playing = $opponent;
      $waiting = $player;
    }
    $playing.css('background-color', '#73d473');
    $waiting.css('background-color', '');
  };

  const computerPlay = (level, player_to_move) => {

    if(player_to_move === 'player') {
      toggleNameHighlights();
      toggleOpponentBoardState();
    }
    else {
      toggleNameHighlights(false);
      setTimeout(() => move(level), 500); //1000);
    }
  };

  const logMessage = (who, message) => {
    const $message = $(`<p> - <strong>${who}</strong> ${message}</p>`);
    $('#log-messages').prepend($message);
  };  

  const start = (level, first_player) => {

    logMessage(first_player, `goes first...`);
    $('.ship-graveyard').css('display', 'grid');

    if(level === 'online') {
      onlinePlay(first_player);
    }
    else {
      const $name = $('<div class="name">Computer</div>');
      $('#opponent').prepend($name);
      computerPlay(level, first_player);
    }
  };

  const onlinePlay = (first_player) => {

  };

  return {
    start
  };
});