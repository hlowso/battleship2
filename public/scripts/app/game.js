// TODO if the user quits first at the end of the game, it seems the win data
// is not sent to the database...

define(['./util', './leaderboard'], function(util, leaderboard) {

  const goToGameOverModal = (win, other_player='') => {
    let header, body;
    if(win) {
      header = '<h3>You win!</h3>';
      body = `<p>You defeated your opponent in ${$('#player').data('shots')} shots. </p>`;

      if(other_player === 'computer') {
        body += `
        <p>Enter a username to save the result.<p>
        <input placeholder="...">
      `;
      }
    }
    else {
      header = '<h3>You lose!</h3>';
      body = '<p>Better luck next time!</p>';
    }

    $game_over_modal = util.createModal('game_over', header, body);

    if(win && other_player === 'computer') {
      $game_over_modal.find('input').on('keypress', function(event) {
        if(event.key === 'Enter') {
          let username = util.escape(event.target.value);
          if(!username) {
            alert('username field cannot be empty');
          }
          else if(username === 'computer') {
            alert('pick a different name');
          }
          else if(!/^[a-z1-9]*$/i.test(username)) {
            alert('username must consist only of alphanumeric characters');
          }
          else {
            leaderboard.update(username, other_player);
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
    else if(win) {
      $game_over_modal.on('hidden.bs.modal', function(event) {
        leaderboard.update($('#player').data('name'), 'human');
        const ws = $('#player').data('ws');
        ws.send(JSON.stringify({ type: 'over' }));
        window.location.replace('/');
      });
      $game_over_modal.modal();  
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

    if($('#opponent').data('level') === 'online') {
      addToShipGraveyard(ship_name, (who === $('#player').data('name')));
      const ws = $('#player').data('ws');
      ws.send(JSON.stringify({
        type: 'sink',
        data: { ship_name }
      }));
    }
    else {
      addToShipGraveyard(ship_name, (who === 'player'));
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
  const sendBoardJSON = (ws, message_type) => {
    const $board = (message_type === 'ready') ? $('#player').find('.board') : $('#opponent').find('.board');
    ws.send(JSON.stringify({ 
      type: message_type,
      data: { fleet: $board.data('fleet'), sea: $board.data('sea') }
    }));
  };

  const getBoardClickHandler = ($board, computer_play=true) => {
    return function(event) {
      if($(event.target).prop('tagName') !== 'SPAN') {
        const index   = $(event.target).data('index');
        const change  = attemptAttack($board, index, (computer_play) ? 'player' : $('#player').data('name'));
        if(change) {
          let shots = Number($('#player').data('shots'));
          shots ++;
          $('#player').data('shots', `${shots}`);
          toggleOpponentBoardState(false, false);
          util.updateBoardFromJSON('opponent');
          let win = checkWin($board.data('fleet'));
          if(win) {
            sendBoardJSON($('#player').data('ws'), 'attack');
            goToGameOverModal(true, (computer_play) ? 'computer' : 'person');
          }
          else {
            let level = $('#opponent').data('level');
            if(level === 'online') {
              sendBoardJSON($('#player').data('ws'), 'attack');
              onlinePlay('opponent');
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

    if($('#opponent').data('level') === 'online') {
      const ws = $('#player').data('ws');
      ws.send(JSON.stringify({ 
        type: 'log',
        data: { html: $message.prop('outerHTML') }
      }));    
    }
  };  

  const start = (level, first_player) => {
    $('#player').data('shots', '0');
    $('.ship-graveyard').css('display', 'grid');

    if(level === 'online') {
      if(first_player === 'player') {
        logMessage($('#player').data('name'), 'goes first...');
      }
      onlinePlay(first_player);
    }
    else {
      logMessage(first_player, 'goes first...');
      computerPlay(level, first_player);
    }
  };

  const generateOnMessageHandler = (callback) => {
    return event => {
      const data = JSON.parse(event.data);
      if(data.broken) {
        $disconnect = util.createModal('disconnect', 'Disconnected!', 'You probably intimidated your opponent...');
        $disconnect.on('hidden.bs.modal', function(event) {
          window.location.replace('/');
        });
        $disconnect.modal();  
      }
      else {
        callback(data);
      }
    };
  };

  const awaitOpponent = () => {
    const ws = $('#player').data('ws');
    ws.onmessage = generateOnMessageHandler(data => {

      if(data.fleet) {
        const $board = $('#player').find('.board');
        $('#player').find('.board').data('fleet', data.fleet);
        $('#player').find('.board').data('sea', data.sea);
        util.updateBoardFromJSON('player');
        let win = checkWin($board.data('fleet'));
        if(win) {
          goToGameOverModal(false);
        }
        else {
          onlinePlay('player');
        }   
      }
      else if(data.ship_name){

        console.log('here', data.ship_name);

        addToShipGraveyard(data.ship_name, false);
      }
      else {
        $('#log-messages').prepend($(data.html));
      }
    });
  };

  const onlinePlay = (player_to_move) => {
    if(player_to_move === 'player') {
      toggleNameHighlights();
      toggleOpponentBoardState(false);
    }
    else {
      toggleNameHighlights(false);
      awaitOpponent();
    }
  };

  return {
    start,
    sendBoardJSON,
    generateOnMessageHandler
  };
});