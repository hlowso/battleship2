
requirejs(['app/setup'], function (setup) {

  setup.setBoard('player');
  const play_comp_button    = setup.createPlayCompButton();
  const play_online_button  = setup.createPlayOnlineButton();

  $('#opponent').append(play_comp_button[0]);
  $('#opponent').append(play_online_button[0]);

  setup.showOrHideButton(play_comp_button[0], play_comp_button[1]);
  setup.showOrHideButton(play_online_button[0], play_online_button[1]);

});