const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema({
  mvUrl: {
  type: String
  },
  title: {
    type: String,
    required: true
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  },
  album: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album'
  },
  duration: {
    type: Number,
    required: true
  },
  releaseYear: {
    type: Number
  },
  genre: {
    type: String
  },
  subGenre: {
    type: String
  },
  language: {
    type: String
  },
  mood: {
    type: String
  },
  scene: {
    type: String
  },
  coverImage: {
    type: String,
    default: '/img/default-cover.jpg'
  },
  audioFile: {
    type: String,
    required: true
  },
  audioFileHQ: {
    type: String
  },
  lyrics: {
    type: String
  },
  lyricsTranslation: {
    type: String
  },
  playCount: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  bpm: {
    type: Number
  },
  isVIP: {
    type: Boolean,
    default: false
  },
  isHot: {
    type: Boolean,
    default: false
  },
  isNew: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    likes: {
      type: Number,
      default: 0
    },
    likedBy: [{
      type: String
    }],
    isHot: {
      type: Boolean,
      default: false
    },
    replies: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      text: {
        type: String
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      likes: {
        type: Number,
        default: 0
      },
      likedBy: [{
        type: String
      }]
    }]
  }]
});

module.exports = mongoose.model('Song', SongSchema);