const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const uuid = require("uuid");
const jwt = require("jsonwebtoken");
const mongo = require("../lib/db.js");
const dbName = "msgsdb";
const userCollection = "users";
const msgCollection = "msgs";
const userMiddleware = require("../middleware/users.js");

// << db init >>
mongo.initialize(dbName, userCollection, function(userCollection) { // successCallback
	router.post("/sign-up", userMiddleware.validateRegister, (req, res, next) => {
	const username = req.body.username;
	const email = req.body.email;
	userColl.find(email).toArray((error, result) => {
		if (result.length) {
			return res.status(409).send({
				msg: "This email is already in use! Login if it is your account",
			});
		} else {
			bcrypt.hash(req.body.password, 10, (err, hash) => {
				if (err) {
					return res.status(500).send({
						msg: err,
					});
				} else {
					let newPass = {
				email: req.body.email,
username: req.body.username,
password: hash
			}
			console.log(newPass)
					userColl.insertOne(newPass, (error, result) => {
						if (error) {
							throw error;
							return res.status(400).send({
								msg: error,
							});
						}
						return res.status(201).send({
							msg: "Registered!",
						});
					});
				}
			});
		}
	});
});

});

mongo.initialize(dbName, userCollection, function(userColl){
	//successCallback
router.post("/login", (req, res, next) => {
	userColl.find({username: req.body.username}).toArray((err, result) => {
		// user does not exist
		if (err) {
			throw err;
			return res.status(400).send({
				msg: err,
			});
		}
		if (!result.length) {
			return res.status(401).send({
				msg: "Username or password is incorrect!",
			});
		}
		// check password
		bcrypt.compare(req.body.password, result[0]["password"], (bErr, bResult) => {
			// wrong password
			if (bErr) {
				throw bErr;
				return res.status(401).send({
					msg: "Username or password is incorrect!",
				});
			}
			if (bResult) {
				const token = jwt.sign(
					{
						username: result[0].username,
						userId: result[0].id,
					},
					"SECRETKEY",
					{
						expiresIn: "7d",
					}
				);
				return res.status(200).send({
					msg: "Logged in!",
					token: token,
					user: result[0],
				});
			}
			return res.status(401).send({
				msg: "Username or password is incorrect!",
			});
		});
});
})
})



router.get("/secret-route", userMiddleware.isLoggedIn, (req, res, next) => {
	console.log(req.userData);
	res.send("This is the secret content. Only logged in users can see that!");
});

router.post("/post-message", userMiddleware.isLoggedIn, (req, res, next) => {
	console.log(req.userData.username);
	console.log(req.body.message);
	db.query(`INSERT INTO Messages (author, authorid, message, posted_at) VALUES ('${req.userData.username}', '${req.userData.userId}', ${db.escape(req.body.message)}, now())`, (err, result) => {
		if (err) {
			throw err;
			return res.status(400).send({
				msg: err,
			});
		}
		return res.status(201).send({
			msg: "Sent!",
		});
	});
});

router.post("/like-message", userMiddleware.isLoggedIn, (req, res, next) => {
	console.log("entering here");

	console.log("data: " + req.userData.userId);

	db.query(`SELECT * FROM user_likes WHERE userid = '${req.userData.userId}' AND messageid = ${req.body.id}`, (err, result) => {
		console.log("Select query done");
		if (err) {
			console.log("Error: " + err);
			throw err;
		}
		if (result.length == 0) {
			console.log("User has not liked message before");
			db.query(`UPDATE Messages SET post_likes = post_likes + 1 WHERE id = ${req.body.id}`,
				(err, result) => {
					if (err) {
						throw err;
						return res.status(400).send({
							msg: err
						});
					}
					return res.status(202).send({
						msg: 'Liked!'
					});
				}
			);

			db.query(`INSERT INTO user_likes (userid, messageid, liked_time) VALUES ('${req.userData.userId}',${req.body.id},now())`);
		} else {
			console.log("User has already liked message.");
		}
	});
});

router.post("/follow-user", userMiddleware.isLoggedIn, (req, res, next) => {
	console.log("Entered the follow router");
	console.log("userId: " + req.userData.userId + " authorId: " + req.body.followed);

	if (req.userData.userId === req.body.followed) {
		return res.status(400).send({
			msg: 'You cannot follow yourself!'
		})
	} else {
		db.query(
			`INSERT INTO User_follows (followerId, followedId) VALUES ('${req.userData.userId}', '${req.body.followed}')`, (err, result) => {
				if (err) {
					//throw err;
					return res.status(400).send({
						msg: err
					});
				}
				console.log(result)
				return res.status(201).send({
					msg: 'Now following ' + req.body.followed + '!'
				});
			}
		)

	}

})

mongo.initialize(dbName, userCollection, function(messageCollection) {
router.get("/get-messages", userMiddleware.isLoggedIn, (req, res, next) => {
	console.log(req.userData);
	messageCollection.find().toArray((err, result) => {
		if (err) {
			throw err;
			return res.status(400).send({
				msg: err,
			});
		};
		res.json(result);
	})
	
});
});

module.exports = router;
