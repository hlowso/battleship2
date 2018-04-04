module.exports = (mongoDB) => {
  const db           = mongoDB.db('battleship');


  // console.log(mongoDB);


  // TEST
  // db.createCollection("customers", function(err, res) {
  //   if (err) throw err;
  //   console.log("Collection created!");
  // });

  // const lb_col       = db.collection('leaderboard');

  return {

    getLeaderboard: () => {
      return new Promise((resolve, reject) => {
        lb_col.find().toArray((err, leaderboard) => {
          if(err) {
            reject(err);
          }
          resolve(leaderboard);
        });
      });
    },

    updateLeaderboard: (win_obj) => {
      const operators  = { $inc: { total_wins: 1 } };
      const query      = { name: win_obj.username };
      const new_user   = { 
        name: win_obj.username,
        total_wins: 1
      };

      if(win_obj.opponent === 'computer') {
        operators.$inc.comp_wins = 1;
        new_user.comp_wins = 1;
        new_user.online_wins = 0;
      }
      else {
        operators.$inc.online_wins = 1;
        new_user.comp_wins = 0;
        new_user.online_wins = 1;
      }

      return new Promise((resolve, reject) => {
        lb_col.findOne(query, (err, user) => {
          if(user) {
            lb_col.update(query, operators);
          }
          else {
            lb_col.insert(new_user);
          }
        });
      });
    }

  };
};