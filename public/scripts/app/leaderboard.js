define(['./util'], function(util) {

  const printLeaderboardHTML = (leaderboard) => {

    const header = `
      <button type="button" class="close" data-dismiss="modal">&times;</button>
      <h3 class="modal-title">Leaderboard</h3>
    `;

    const body = `
      <table>
        <tr>
          <th>rank</th>
          <th>username</th>
          <th>wins against computer</th>
          <th>wins against players</th>
          <th>total wins</th>
        </tr>
      </table>
    `;

    const $leaderboard = util.createModal('leaderboard', header, body);

    const $table  = $leaderboard.find('table');
    let   rank    = 1;

    leaderboard.sort((a, b) => 
      (b.total_wins - a.total_wins)
    );

    for(let user_obj of leaderboard) {
      let $entry = $(`
        <tr>
          <td>${rank++}</td>
          <td>${user_obj.name}</td>
          <td>${user_obj.comp_wins}</td>
          <td>${user_obj.online_wins}</td>
          <td>${user_obj.total_wins}</td>
        </tr>
      `);
      $table.append($entry);
    }

    $leaderboard.modal();
  };

  return {

    getAndPrint: () => {
      $.ajax({
        url: '/leaderboard',
        method: 'GET',
        success: (res) => {
          printLeaderboardHTML(res);
        }
      });
    },

    update: (username, opponent) => {
      $.ajax({
        url: '/leaderboard',
        method: 'PUT',
        data: {
          username,
          opponent
        },
        success: (res) => {
          window.location.replace('/');  
        }
      });
    }

  };
});