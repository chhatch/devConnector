const express = require('express')
const router = express.Router()
const {check, validationResult} = require('express-validator')
const auth = require('../../middleware/auth')

const Post = require('../../db/models/Post')
const Profile = require('../../db/models/Profile')
const User = require('../../db/models/User')

// @route GET api/posts
// @desc Create a post
// @access Private

router.post(
    '/',
    [
        auth,
        check('text', 'Text is required')
            .not()
            .isEmpty(),
    ],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            res.status(400).json({errors: errors.array()})
        } else {
            try {
                const user = await User.findById(req.user.id).select(
                    '-password',
                )
                const newPost = new Post({
                    text: req.body.text,
                    name: user.name,
                    avatar: user.avatar,
                    user: req.user.id,
                })

                const post = await newPost.save()
                res.json(post)
            } catch (err) {
                console.error(err.message)
                res.status(500).send('Server Error')
            }
        }
    },
)

module.exports = router
