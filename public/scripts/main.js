// $(document).ready(function() {
requirejs(['app/setup', 'app/leaderboard'], function (setup, leaderboard) {

  //const ws = new WebSocket('ws://localhost:3001');
  // ws.onopen = data => {
  //   console.log(data);
  // };

  $('#leaderboard-button').on('click', leaderboard.getAndPrint);

  setup.printHTMLGrid('player');
  const play_comp_button    = setup.createPlayCompButton();
  const play_online_button  = setup.createPlayOnlineButton();

  setup.showOrRemoveButton(play_comp_button[0], play_comp_button[1], $('#opponent'));
  setup.showOrRemoveButton(play_online_button[0], play_online_button[1], $('#opponent'));

});

