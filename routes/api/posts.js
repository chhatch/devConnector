const express = require('express')
const router = express.Router()
const {check, validationResult} = require('express-validator')
const auth = require('../../middleware/auth')

const Post = require('../../db/models/Post')
const Profile = require('../../db/models/Profile')
const User = require('../../db/models/User')

// @route POST api/posts
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

// @route GET api/posts
// @desc Get all posts
// @access Private

router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({date: -1})
        res.json(posts)
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

// @route GET api/posts/:id
// @desc Get posts by id
// @access Private

router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        if (!post) return res.status(404).send({msg: 'Post not found.'})

        res.json(post)
    } catch (err) {
        console.error(err.message)
        if (err.kind === 'ObjectId')
            return res.status(404).send({msg: 'Post not found.'})

        res.status(500).send('Server Error')
    }
})

// @route DELETE api/posts/:id
// @desc Delete post by id
// @access Private

router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        if (!post) return res.status(404).send({msg: 'Post not found.'})

        //check user
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({msg: 'User not authorized'})
        }

        await post.remove()

        res.json({msg: 'Post removed'})
    } catch (err) {
        console.error(err.message)
        if (err.kind === 'ObjectId')
            return res.status(404).send({msg: 'Post not found.'})

        res.status(500).send('Server Error')
    }
})

// @route PUT api/posts/like/:id
// @desc Like a post by id
// @access Private

router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        if (!post) return res.status(404).send({msg: 'Post not found.'})

        //check if the post has already been liked by user
        if (
            post.likes.filter(like => like.user.toString() === req.user.id)
                .length > 0
        ) {
            return res.status(400).json({msg: 'Post already liked.'})
        }

        post.likes.unshift({user: req.user.id})
        await post.save()
        res.json(post.likes)
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

// @route PUT api/posts/unlike/:id
// @desc Unlike a post by id
// @access Private

router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        if (!post) return res.status(404).send({msg: 'Post not found.'})

        //check if the post has already been liked by user
        if (
            post.likes.filter(like => like.user.toString() === req.user.id)
                .length === 0
        ) {
            return res.status(400).json({msg: 'Post has not yet been liked.'})
        }

        const removeIndex = post.likes
            .map(like => like.user.toString())
            .indexOf(req.user)
        post.likes.splice(removeIndex, 1)
        await post.save()
        res.json(post.likes)
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

// @route POST api/posts/comment/:id
// @desc Comment on a post
// @access Private

router.post(
    '/comment/:id',
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
                const post = await Post.findById(req.params.id)
                const newComment = new Post({
                    text: req.body.text,
                    name: user.name,
                    avatar: user.avatar,
                    user: req.user.id,
                })

                post.comments.unshift(newComment)

                await post.save()

                res.json(post.comments)
            } catch (err) {
                console.error(err.message)
                res.status(500).send('Server Error')
            }
        }
    },
)

// @route DELETE api/posts/comment/:id/:comment_id
// @desc Delete post comment by id
// @access Private

router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        if (!post) return res.status(404).send({msg: 'Post not found.'})

        const comment = post.comments.find(
            comment => comment.id === req.params.comment_id,
        )

        if (!comment) return res.status(400).send({msg: 'Comment not found.'})

        //check user
        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({msg: 'User not authorized'})
        }

        const removeIndex = post.comments
            .map(comment => comment.user.toString())
            .indexOf(req.user.id)
        if (removeIndex > -1) {
            post.comments.splice(removeIndex, 1)
        } else {
            return res.status(400).send({msg: 'Comment not found.'})
        }

        await post.save()

        res.json(post.comments)
    } catch (err) {
        console.error(err.message)
        if (err.kind === 'ObjectId')
            return res.status(404).send({msg: 'Resource not found.'})

        res.status(500).send('Server Error')
    }
})

module.exports = router
