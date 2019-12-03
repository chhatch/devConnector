const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const {check, validationResult} = require('express-validator')
const Profile = require('../../db/models/Profile')
const User = require('../../db/models/User')

// @route GET api/profile/me
// @desc Get current users profile
// @access Public

router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id,
        }).populate('user', ['name', 'avatar'])

        if (!profile) {
            res.status(400).json({msg: 'There is no profile for this user.'})
        } else {
            res.json(profile)
        }
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server error.')
    }
})

// @route Post api/profile
// @desc create or update user profile
// @access Public
router.post(
    '/',
    [
        auth,
        check('status', 'Status is required.')
            .not()
            .isEmpty(),
        check('skills', 'Skills are required.')
            .not()
            .isEmpty(),
    ],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()})
        }

        const {
            company,
            website,
            location,
            bio,
            status,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin,
        } = req.body

        // Build profile object
        const profileFields = {}
        profileFields.user = req.user.id
        if (company) profileFields.company = company
        if (website) profileFields.website = website
        if (location) profileFields.location = location
        if (bio) profileFields.bio = bio
        if (status) profileFields.status = status
        if (githubusername) profileFields.githubusername = githubusername
        if (skills) {
            profileFields.skills = skills.split(',').map(skill => skill.trim())
        }

        // Build social object
        profileFields.social = {}
        if (youtube) profileFields.social.youtube = youtube
        if (twitter) profileFields.social.twitter = twitter
        if (facebook) profileFields.social.facebook = facebook
        if (linkedin) profileFields.social.linkedin = linkedin
        if (instagram) profileFields.social.instagram = instagram

        try {
            let profile = await Profile.findOne({user: req.user.id})

            if (profile) {
                //update
                profile = await Profile.findOneAndUpdate(
                    {user: req.user.id},
                    {$set: profileFields},
                    {new: true},
                )
                return res.json(profile)
            } else {
                //create
                profile = new Profile(profileFields)
                await profile.save()
                return res.json(profile)
            }
        } catch (err) {
            console.log(err.message)
            res.status(500).send('Sever Error')
        }
    },
)

// @route GET api/profile
// @route GET all profiles
// @access Public

router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', [
            'name',
            'avatar',
        ])
        res.json(profiles)
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

// @route GET api/profile/user/:user_id
// @route GET profile by user
// @access Public

router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.params.user_id,
        }).populate('user', ['name', 'avatar'])
        if (!profile) {
            res.status(404).json({msg: 'Profile not found.'})
        } else {
            res.json(profile)
        }
    } catch (err) {
        console.error(err.message)
        if (err.kind == 'ObjectId') {
            res.status(400).json({msg: 'Profile not found.'})
        } else {
            res.status(500).send('Server Error')
        }
    }
})

module.exports = router
