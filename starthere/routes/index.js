var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log('Logout error:', err);
      return res.redirect('/');
    }

    res.clearCookie('connect.sid');
    return res.redirect('/');
  });
});


module.exports = router;
