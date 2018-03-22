
define(['./util', './leaderboard'], function(util, leaderboard) {

  const goToGameOverModal = (win, other_player='') => {
    let header, body;
    if(win) {
      header = '<h3>You win!</h3>';
      body = `
        <p>You defeated your opponent in ${$('#player').data('shots')} shots. </p>
        <p>Enter a username to save the result.<p>
        <input 
      `;
    }
    else {
      header = '<h3>You lose!</h3>';
      body = '<p>Better luck next time!</p>';
    }

    $game_over_modal = util.createModal('game_over', header, body);

    if(win) {
      $game_over_modal.find('input').on('keypress', function(event) {
        if(event.key === 'Enter') {
          if(!event.target.value) {
            alert('username field cannot be empty');
          }
          else if(event.target.value === 'computer') {
            alert('pick a different name');
          }
          else {
            leaderboard.update(event.target.value, other_player);
          }
        }
      });
      $game_over_modal.on('hidden.bs.modal', function(event) {
        event.preventDefault();
        alert('Enter a username');
      });
      $game_over_modal.modal({
        backdrop: 'static',
        keyboard: false
      });
    }
    else {
      $game_over_modal.on('hidden.bs.modal', function(event) {
        window.location.replace('/');
      });
      $game_over_modal.modal();      
    }
  };

  // AI
  const move = (level) => {
    const $board = $('#player').find('.board');

    switch(level) {
      case 1: 
        easyMove($board);
        break;
      case 2:
        hardMove($board);
        break;
    }

    util.updateBoardFromJSON('player');
    let win = checkWin($board.data('fleet'));
    if(win) {
      goToGameOverModal(false);
    }
    else {
      computerPlay(level, 'player');
    }
  };

  const easyMove = ($board) => {
    const fleet             = $board.data('fleet');
    const sea               = $board.data('sea');
    const possible_targets  = util.getAllUnmolested(fleet, sea);
    return attemptAttack($board, possible_targets[Math.floor(Math.random() * possible_targets.length)], 'computer');
  };

  const hardMove = ($board) => {
    const fleet  = $board.data('fleet');
    const sea    = $board.data('sea');

    for(let ship_name in fleet) {
      for(let part of fleet[ship_name].parts) {
        if(part.state === 'hit') {
          for(let target of fleet[ship_name].parts) {
            if(target.state === 'unharmed') {
              return attemptAttack($board, util.coordsToTileIndex(target.coords), 'computer');
            }
          }
        }
      }
    }

    const unmolested = util.getAllUnmolested(fleet, sea);
    return attemptAttack($board, unmolested[Math.floor(Math.random() * unmolested.length)], 'computer');
  };

  // UPDATING THE DOM
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
        if(part.coords.toString() === util.tileIndexToCoords(index).toString()) {
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
    if(sea.includes(index)) {
      return false;
    }
    sea.push(index);
    $board.data('sea', sea);
    logMessage(who, `fires at ${index}: MISS`);
    return true;
  };

  // PLAYER MOVES
  const getBoardClickHandler = ($board, computer_play=true) => {
    return function(event) {
      if($(event.target).prop('tagName') !== 'SPAN') {
        const index   = $(event.target).data('index');
        const change  = attemptAttack($board, index, 'player');
        if(change) {
          let shots = Number($('#player').data('shots'));
          shots ++;
          $('#player').data('shots', `${shots}`);
          toggleOpponentBoardState(false);
          util.updateBoardFromJSON('opponent');
          let win = checkWin($board.data('fleet'));
          if(win) {
            goToGameOverModal(true, (computer_play) ? 'computer' : $('#opponent').data('name'));
          }
          else {
            let level = $('#opponent').data('level');
            if(level === 'online') {
              onlinePlay();
            }
            else {
              computerPlay(level, 'computer');
            }
          }
        }
      } 
    };
  };

  const toggleOpponentBoardState = (computer_play, on=true) => {
    const $board = $('#opponent').find('.board');
    if(on) {
      $board.on('click', getBoardClickHandler($board, computer_play)); 
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
      toggleOpponentBoardState(true);
    }
    else {
      toggleNameHighlights(false);
      setTimeout(() => move(level), 1000); 
    }
  };

  const logMessage = (who, message) => {
    const $message = $(`<p> - <strong>${who}</strong> ${message}</p>`);
    $('#log-messages').prepend($message);
  };  

  const start = (level, first_player) => {
    $('#player').data('shots', '0');

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

  //TODO...
  const onlinePlay = (player_to_move) => {

  };

  return {
    start
  };
});